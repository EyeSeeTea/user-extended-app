import React, { useCallback, useEffect } from "react";
import _ from "lodash";

import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { Dialog, DialogTitle, DialogActions, DialogContent, Button } from "@material-ui/core";
import { InputField } from "@dhis2/ui";
import { Form, FormSpy, Field } from "react-final-form";
import { FormState } from "final-form";

import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";

import { Id } from "../../../domain/entities/Ref";
import { UserProps, defaultUserProps } from "../../../domain/entities/UserProps";
import { User } from "../../../domain/entities/User";
import { ReplicateTemplate, ReplicateTemplateProps } from "../../../domain/entities/ReplicateTemplate";

interface ReplicateUserFromTemplateProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
}

export const ReplicateUserFromTemplate: React.FC<ReplicateUserFromTemplateProps> = props => {
    const { compositionRoot } = useAppContext();
    const { userToReplicateId, onRequestClose } = props;

    const [userToReplicate, setUserToReplicate] = React.useState<UserProps>(defaultUserProps);
    const [existingUsernames, setExistingUsernames] = React.useState<string[]>([]);
    const [replicateTitle, setReplicateTitle] = React.useState<string>(i18n.t("Replicate User"));
    const [hasValidationErrors, setValidationError] = React.useState<boolean>(false);
    const [isUserLoaded, setIsUserLoaded] = React.useState(true);
    const [isMounted, setIsMounted] = React.useState(false);

    const randomPasswordBase = React.useMemo(() => {
        return User.generateRandomPassword();
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

        compositionRoot.users.listAll({}).run(
            users => {
                const usernames = users.map(user => user.username);
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
                                const errors = ReplicateTemplate.validateReplicateTemplate(values, existingUsernames);
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
                                                    "Please ensure to copy the password and adhere to security guidelines. Using $index is optional."
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
type FormValues = ReplicateTemplateProps;

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
