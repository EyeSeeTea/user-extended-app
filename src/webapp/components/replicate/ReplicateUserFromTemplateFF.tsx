import React, { useCallback, useEffect } from "react";
import _ from "lodash";

import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { Dialog, DialogTitle, DialogActions, DialogContent, Button } from "@material-ui/core";
import {
    InputField,
    composeValidators,
    createMaxCharacterLength,
    createMinCharacterLength,
    createPattern,
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

export const ReplicateUserFromTemplateFCFF: React.FC<ReplicateUserFromTemplateProps> = props => {
    const { compositionRoot } = useAppContext();
    const { userToReplicateId, onRequestClose } = props;

    const [userToReplicate, setUserToReplicate] = React.useState<User>(defaultUser);
    const [existingUsernames, setExistingUsernames] = React.useState<string[]>([]);
    const [replicateTitle, setReplicateTitle] = React.useState<string>(i18n.t("Replicate User"));
    const [hasValidationErrors, setValidationError] = React.useState<boolean>(false);
    const [isUserLoaded, setIsUserLoaded] = React.useState(true);
    const [isMounted, setIsMounted] = React.useState(false);

    const loading = useLoading();
    const snackbar = useSnackbar();

    useEffect(() => {
        const handleUsersError = (message: string) => {
            snackbar.error(i18n.t(message));
            onRequestClose();
        };

        loading.show(true);
        setIsUserLoaded(true);

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
        setIsUserLoaded(false);
    }, [compositionRoot, loading, onRequestClose, snackbar, userToReplicateId]);

    useEffect(() => {
        if (!isUserLoaded && userToReplicate.username) {
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
                        const errorMessage = i18n.t("Error replicating user {{user}}: {{message}}", {
                            user: userToReplicate.username,
                            message: error,
                            nsSeparator: false,
                        });
                        loading.hide();
                        snackbar.error(errorMessage);
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
                        <Form<formValues>
                            onSubmit={replicateUsers}
                            initialValues={{
                                replicateCount: "1",
                                usernameTemplate: `${userToReplicate.username}_$index`,
                                passwordTemplate: `${UserLogic.DEFAULT_PASSWORD}_$index`,
                            }}
                            validate={values => {
                                const errors: {
                                    replicateCount?: string;
                                    usernameTemplate?: string;
                                    passwordTemplate?: string;
                                } = {};
                                const replicateCountErrors = getValidators("usersToCreate").validation(
                                    values.replicateCount
                                );
                                const usernameErrors = getValidators(
                                    "username",
                                    existingUsernames,
                                    values.replicateCount
                                ).validation(values.usernameTemplate);
                                const passwordErrors = getValidators("password").validation(values.passwordTemplate);
                                if (replicateCountErrors) errors.replicateCount = replicateCountErrors;
                                if (usernameErrors) errors.usernameTemplate = usernameErrors;
                                if (passwordErrors) errors.passwordTemplate = passwordErrors;
                                return errors;
                            }}
                            autocomplete="off"
                            render={({ handleSubmit }) => (
                                <>
                                    <FormSpy
                                        onChange={(state: FormState<formValues>) => {
                                            requestAnimationFrame(() => {
                                                setValidationError(!_.isEmpty(state.errors));
                                            });
                                        }}
                                    />

                                    <form id="replicate-form" onSubmit={handleSubmit}>
                                        <DialogContent>
                                            <RenderFormField name="replicateCount" label="Number of users to create" />
                                            <RenderFormField name="usernameTemplate" label="Username template" />
                                            <RenderFormField name="passwordTemplate" label="Password template" />
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

type FieldTypes = "usersToCreate" | "username" | "password";

const getValidators = (
    field: FieldTypes,
    existingUsernames: string[] = [],
    count = "0"
): { validation: (...args: any[]) => string | undefined } => {
    switch (field) {
        case "usersToCreate": {
            return {
                validation: (value: string) => {
                    const numericValue = parseInt(value, 10);
                    if (numericValue < 1 || numericValue > 100) {
                        return i18n.t("Value must be between 1 and 100");
                    }
                    const validators = composeValidators(
                        number,
                        hasValue,
                        createMinCharacterLength(1),
                        createMaxCharacterLength(3)
                    );
                    return validators(value);
                },
            };
        }
        // TODO: Add template will conflict with existing usernames validation
        case "username": {
            return {
                validation: (value: string) => {
                    if (!value) return i18n.t("Please provide a username");
                    const countInt = parseInt(count);
                    if (countInt > 1 && !value.includes("$index")) {
                        return i18n.t("Username must contain $index");
                    }
                    if (existingUsernames.includes(value)) {
                        return i18n.t("User already exists");
                    }
                    const usernameTemplate = _.times(countInt, index => getFromTemplate(value, index));
                    if (_.intersection(usernameTemplate, existingUsernames).length > 0) {
                        return i18n.t("Template will conflict with existing usernames");
                    } else {
                        const validators = composeValidators(
                            string,
                            createMinCharacterLength(2),
                            createMaxCharacterLength(140)
                        );
                        return validators(value);
                    }
                },
            };
        }
        case "password": {
            return {
                validation: (value: string) => {
                    if (!value) {
                        return i18n.t("Please provide a password");
                    } else {
                        const validators = composeValidators(
                            string,
                            createMinCharacterLength(8),
                            createMaxCharacterLength(255),
                            createPattern(/.*[a-z]/, i18n.t("Password should contain at least one lowercase letter")),
                            createPattern(/.*[A-Z]/, i18n.t("Password should contain at least one UPPERCASE letter")),
                            createPattern(/.*[0-9]/, i18n.t("Password should contain at least one number")),
                            createPattern(/[^A-Za-z0-9]/, i18n.t("Password should have at least one special character"))
                        );
                        return validators(value);
                    }
                },
            };
        }
        default: {
            return { validation: hasValue };
        }
    }
};

type formValues = { replicateCount: string; usernameTemplate: string; passwordTemplate: string };

interface InputFieldProps {
    label: string;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    error: string | undefined;
}

const RenderFormField: React.FC<{ name: string; label: string }> = ({ name, label }) => {
    return (
        <Field name={name}>
            {({ input, meta }) => (
                <RenderInputField label={label} value={input.value} setValue={input.onChange} error={meta.error} />
            )}
        </Field>
    );
};

const RenderInputField: React.FC<InputFieldProps> = ({ label, value, setValue, error }) => {
    const handleChange = (data: { name?: string; value?: string }) => {
        const newValue = data.value || "";
        setValue(newValue);
    };

    return <InputField label={label} value={value} onChange={handleChange} validationText={error} error={!!error} />;
};

export default ReplicateUserFromTemplateFCFF;
