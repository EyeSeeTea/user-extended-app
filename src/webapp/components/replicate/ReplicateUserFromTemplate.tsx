import React, { useCallback, useEffect } from "react";
import _ from "lodash";

import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { Dialog, DialogTitle, DialogActions, DialogContent, Button } from "@material-ui/core";
import {
    InputField,
    composeValidators,
    createMaxCharacterLength,
    createMinCharacterLength,
    hasValue,
    string,
    number,
} from "@dhis2/ui";
import { Form, FormSpy, Field } from "react-final-form";
import { FormState } from "final-form";

import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";
import { getFromTemplate } from "../../../utils/template";

import { Id } from "../../../domain/entities/Ref";
import { User, defaultUser } from "../../../domain/entities/User";
import { UserLogic } from "../../../domain/entities/UserLogic";

interface ReplicateUserFromTemplateProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
}

export const ReplicateUserFromTemplate: React.FC<ReplicateUserFromTemplateProps> = props => {
    const { compositionRoot } = useAppContext();
    const { userToReplicateId, onRequestClose } = props;

    const [userToReplicate, setUserToReplicate] = React.useState<User>(defaultUser);
    const [existingUsernames, setExistingUsernames] = React.useState<string[]>([]);
    const [replicateTitle, setReplicateTitle] = React.useState<string>(i18n.t("Replicate User"));
    const [hasValidationErrors, setValidationError] = React.useState<boolean>(false);
    const [isUserLoaded, setIsUserLoaded] = React.useState(true);
    const [isMounted, setIsMounted] = React.useState(false);

    const randomPasswordBase = React.useMemo(() => {
        return UserLogic.generateRandomPassword();
    }, []);

    const loading = useLoading();
    const snackbar = useSnackbar();

    useEffect(() => {
        const handleUsersError = (message: string) => {
            snackbar.error(i18n.t(message));
            onRequestClose();
        };

        loading.show(true);
        setIsUserLoaded(false);

        compositionRoot.users.get([userToReplicateId]).run(
            ([user]) => {
                if (!user) {
                    handleUsersError(`Unable to load user: ${userToReplicateId}`);
                } else {
                    setUserToReplicate(user);
                }
            },
            error => {
                handleUsersError(`Error loading user (${userToReplicateId}): ${error}`);
            }
        );

        compositionRoot.users.listAllUsernames({}).run(
            usernames => {
                setExistingUsernames(usernames);
            },
            error => {
                handleUsersError(`Error loading user (${userToReplicateId}): ${error}`);
            }
        );
        setIsUserLoaded(true);
    }, [compositionRoot, loading, onRequestClose, snackbar, userToReplicateId]);

    useEffect(() => {
        if (isUserLoaded && userToReplicate.username) {
            setReplicateTitle(
                i18n.t("Replicate {{user}}", {
                    user: `${userToReplicate.name} (${userToReplicate.username})`,
                })
            );
            setIsMounted(true);
            loading.reset();
        }
    }, [isUserLoaded, loading, userToReplicate]);

    const replicateUsers = useCallback(
        async ({
            replicateCount,
            usernameTemplate,
            passwordTemplate,
        }: {
            replicateCount: string;
            usernameTemplate: string;
            passwordTemplate: string;
        }) => {
            loading.show(true, i18n.t("Replicating users"));

            return compositionRoot.users
                .replicateFromTemplate(userToReplicate, parseInt(replicateCount), usernameTemplate, passwordTemplate)
                .run(
                    () => {
                        loading.hide();
                        onRequestClose();
                        snackbar.success(
                            i18n.t("User {{user}} replicated successfully {{n}} times", {
                                user: userToReplicate.username,
                                n: replicateCount,
                            })
                        );
                    },
                    error => {
                        loading.hide();
                        snackbar.error(
                            i18n.t("Error replicating user {{user}}: {{message}}", {
                                user: userToReplicate.username,
                                message: error,
                                nsSeparator: false,
                            })
                        );
                    }
                );
        },
        [compositionRoot.users, loading, snackbar, onRequestClose, userToReplicate]
    );

    return (
        <>
            {isMounted && (
                <Dialog open maxWidth="lg" fullWidth>
                    <DialogTitle>{replicateTitle}</DialogTitle>
                    <DialogContent>
                        <Form<FormValues>
                            onSubmit={replicateUsers}
                            initialValues={{
                                replicateCount: "1",
                                usernameTemplate: `${userToReplicate.username}_$index`,
                                passwordTemplate: `${randomPasswordBase}_$index`,
                            }}
                            validate={values => {
                                const errors = formValidator(values, existingUsernames);
                                return errors;
                            }}
                            autocomplete="off"
                            render={({ handleSubmit }) => (
                                <>
                                    <FormSpy
                                        onChange={(state: FormState<FormValues>) => {
                                            requestAnimationFrame(() => {
                                                setValidationError(!_.isEmpty(state.errors));
                                            });
                                        }}
                                    />

                                    <form id="replicate-form" onSubmit={handleSubmit}>
                                        <DialogContent>
                                            <RenderFormField name="replicateCount" label="Number of users to create" />
                                            <RenderFormField
                                                name="usernameTemplate"
                                                label="Username template"
                                                helpText={i18n.t(
                                                    "Using $index is optional if only one replica is created. Multiple $index placeholders can be used anywhere in the fields."
                                                )}
                                            />
                                            <RenderFormField
                                                name="passwordTemplate"
                                                label="Password template"
                                                helpText={i18n.t(
                                                    "Please ensure to copy the password and adhere to security guidelines"
                                                )}
                                            />
                                        </DialogContent>
                                    </form>
                                </>
                            )}
                        />
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={onRequestClose}>{i18n.t("Cancel")}</Button>
                        <Button disabled={hasValidationErrors} type="submit" form="replicate-form" color="primary">
                            {i18n.t("Replicate")}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

function validateReplicateCount(value: string): string | undefined {
    const numericValue = parseInt(value, 10);
    if (numericValue < 1 || numericValue > 100) {
        return i18n.t("Value must be between 1 and 100");
    }
    const validators = composeValidators(number, hasValue, createMinCharacterLength(1), createMaxCharacterLength(3));
    return validators(value);
}

function validateIndex(value: string, count: number, label: "Username" | "Password"): string | undefined {
    if (count > 1 && !value.includes("$index")) {
        return i18n.t(`${label} must contain $index when replicating multiple users`);
    }
}

function validateUsernameSeparator(value: string, count: number): string | undefined {
    const placeholder = getFromTemplate(value, count);
    if (/^[._@-]|[._@-]$/.test(placeholder)) {
        return i18n.t("Username cannot start or end with a separator");
    }
    if (/([._@-]){2,}/.test(placeholder)) {
        return i18n.t("Username cannot have two separators in a row");
    }
    if (!/^[a-zA-Z0-9._@-]+$/.test(placeholder)) {
        return i18n.t("Username can only include . _ - or @ as separators");
    }
}

function validatePassword(value: string, count: number): string | undefined {
    const placeholder = getFromTemplate(value, count);
    if (!/.*[a-z]/.test(placeholder)) {
        return i18n.t("Password should contain at least one lowercase letter");
    }
    if (!/.*[A-Z]/.test(placeholder)) {
        return i18n.t("Password should contain at least one UPPERCASE letter");
    }
    if (!/.*[0-9]/.test(placeholder)) {
        return i18n.t("Password should contain at least one number");
    }
    if (!/[^A-Za-z0-9]/.test(placeholder)) {
        return i18n.t("Password should have at least one special character");
    }
}

function validateMinLength(value: string, count: number, min: number): string | undefined {
    const placeholder = getFromTemplate(value, count);
    if (placeholder.length < min) {
        return i18n.t(`Please enter at least ${min} characters`);
    }
}

function validateMaxLength(value: string, count: number): string | undefined {
    const placeholder = getFromTemplate(value, count);
    if (placeholder.length > 255) {
        return i18n.t("Please enter a maximum of 255 characters");
    }
}

function validateUsernameTemplate(value: string, existingUsernames: string[], count: number): string | undefined {
    if (!value) return i18n.t("Please provide a username");
    const validIndex = validateIndex(value, count, "Username");
    if (validIndex) {
        return validIndex;
    }
    if (existingUsernames.includes(value)) {
        return i18n.t("User already exists");
    }
    const validSeparator = validateUsernameSeparator(value, count);
    if (validSeparator) {
        return validSeparator;
    }

    const validMaxLength = validateMaxLength(value, count);
    if (validMaxLength) {
        return validMaxLength;
    }

    const usernameTemplate = _.times(count, index => getFromTemplate(value, index));
    if (_.intersection(usernameTemplate, existingUsernames).length > 0) {
        return i18n.t("Template will conflict with existing usernames");
    } else {
        const validators = composeValidators(string, createMinCharacterLength(2));
        return validators(value);
    }
}

function validatePasswordTemplate(value: string, count: number): string | undefined {
    if (!value) return i18n.t("Please provide a password");

    const validPassword = validatePassword(value, count);
    if (validPassword) {
        return validPassword;
    }
    const validMinLength = validateMinLength(value, count, 8);
    if (validMinLength) {
        return validMinLength;
    }
    const validMaxLength = validateMaxLength(value, count);
    if (validMaxLength) {
        return validMaxLength;
    } else {
        const validators = composeValidators(string, createMinCharacterLength(8));
        return validators(value);
    }
}

function formValidator(values: FormValues, existingUsernames: string[] = []): FormErrors {
    return {
        replicateCount: validateReplicateCount(values.replicateCount),
        usernameTemplate: validateUsernameTemplate(
            values.usernameTemplate,
            existingUsernames,
            parseInt(values.replicateCount)
        ),
        passwordTemplate: validatePasswordTemplate(values.passwordTemplate, parseInt(values.replicateCount)),
    };
}

const RenderFormField: React.FC<FormFieldProps> = ({ name, label, helpText }) => {
    return (
        <Field name={name}>
            {({ input, meta }) => (
                <RenderInputField
                    label={label}
                    value={input.value}
                    setValue={input.onChange}
                    error={meta.error}
                    helpText={helpText}
                />
            )}
        </Field>
    );
};

const RenderInputField: React.FC<InputFieldProps> = ({ label, value, setValue, error, helpText }) => {
    const handleChange = (data: { value?: string }) => {
        const newValue = data.value || "";
        setValue(newValue);
    };

    return (
        <InputField
            label={label}
            value={value}
            onChange={handleChange}
            validationText={error}
            error={!!error}
            helpText={helpText}
        />
    );
};

type FormFieldLabels = "Number of users to create" | "Username template" | "Password template";
type FormValues = { replicateCount: string; usernameTemplate: string; passwordTemplate: string };
type FormErrors = { replicateCount?: string; usernameTemplate?: string; passwordTemplate?: string };

interface FormFieldProps {
    name: string;
    label: FormFieldLabels;
    helpText?: string;
}

interface InputFieldProps {
    label: FormFieldLabels;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    error: string | undefined;
    helpText?: string;
}

export default ReplicateUserFromTemplate;
