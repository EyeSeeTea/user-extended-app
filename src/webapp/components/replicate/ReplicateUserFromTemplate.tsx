import React, { useCallback, useEffect } from "react";

import { ConfirmationDialog, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { DialogContent } from "@material-ui/core";
import InfoDialog from "../../../legacy/components/InfoDialog";
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

import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";

import { Id } from "../../../domain/entities/Ref";
import { User, defaultUser } from "../../../domain/entities/User";
import { UserLogic } from "../../../domain/entities/UserLogic";

interface ReplicateUserFromTemplateProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
}

export const ReplicateUserFromTemplateFC: React.FC<ReplicateUserFromTemplateProps> = props => {
    const { compositionRoot } = useAppContext();
    const { userToReplicateId, onRequestClose } = props;

    const [userToReplicate, setUserToReplicate] = React.useState<User>(defaultUser);
    const [existingUsernames, setExistingUsernames] = React.useState<string[]>([]);
    const [replicateTitle, setReplicateTitle] = React.useState<string>("");
    const [replicateCount, setReplicateCount] = React.useState<string>("1");
    const [usernameTemplate, setUsernameTemplate] = React.useState<string>("");
    const [passwordTemplate, setPasswordTemplate] = React.useState<string>(`${UserLogic.DEFAULT_PASSWORD}_$index`);
    const [hasValidationErrors, setValidationError] = React.useState<validationErrors>({
        usersToCreate: false,
        username: false,
        password: false,
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [infoDialog, setInfoDialog] = React.useState<{ response: string }>();

    const loading = useLoading();
    const snackbar = useSnackbar();

    useEffect(() => {
        const handleUsersError = (message: string) => {
            snackbar.error(i18n.t(message));
            onRequestClose();
        };

        loading.show(true);
        setIsLoading(true);

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

        setIsLoading(false);
        loading.reset();
    }, [compositionRoot, loading, onRequestClose, snackbar, userToReplicateId]);

    useEffect(() => {
        if (!isLoading) {
            setReplicateTitle(
                i18n.t("Replicate {{user}}", {
                    user: `${userToReplicate.name} (${userToReplicate.username})`,
                })
            );
            setUsernameTemplate(`${userToReplicate.username}_$index`);
        }
    }, [isLoading, userToReplicate]);

    const replicateUsers = useCallback(async () => {
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
                    snackbar.error(error);
                }
            );
    }, [
        compositionRoot.users,
        loading,
        snackbar,
        onRequestClose,
        userToReplicate,
        replicateCount,
        passwordTemplate,
        usernameTemplate,
    ]);


    const CheckFormError = useCallback(
        (label: string, error: boolean) => {
            setValidationError({ ...hasValidationErrors, [label]: error });
        },
        [hasValidationErrors]
    );

    return (
        <ConfirmationDialog
            isOpen={true}
            title={replicateTitle}
            maxWidth={"md"}
            fullWidth={true}
            onSave={replicateUsers}
            saveText={i18n.t("Replicate")}
            disableSave={Object.values(hasValidationErrors).some(validField => validField)}
            onCancel={onRequestClose}
        >
            {infoDialog && (
                <InfoDialog
                    t={i18n.t}
                    title={i18n.t("Replicate error")}
                    onClose={() => setInfoDialog(undefined)}
                    response={infoDialog.response}
                />
            )}

            {!isLoading && (
                <DialogContent>
                    <RenderInputField
                        label={"Number of users to create"}
                        value={replicateCount}
                        setValue={setReplicateCount}
                        validator={getValidators("usersToCreate").validation}
                        setValidationError={CheckFormError}
                    />
                    <RenderInputField
                        label={"username"}
                        value={usernameTemplate}
                        setValue={setUsernameTemplate}
                        validator={getValidators("username", existingUsernames).validation}
                        setValidationError={CheckFormError}
                    />
                    <RenderInputField
                        label={"password"}
                        value={passwordTemplate}
                        setValue={setPasswordTemplate}
                        validator={getValidators("password").validation}
                        setValidationError={CheckFormError}
                    />
                </DialogContent>
            )}
        </ConfirmationDialog>
    );
};

type FieldTypes = "usersToCreate" | "username" | "password";

const getValidators = (
    field: FieldTypes,
    existingUsernames: string[] = []
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
        case "username": {
            return {
                validation: (value: string) => {
                    if (!value) return i18n.t("Please provide a username");
                    if (existingUsernames.includes(value)) {
                        return i18n.t("User already exists");
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

interface validationErrors {
    usersToCreate: boolean;
    username: boolean;
    password: boolean;
}

interface InputFieldProps {
    label: string;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    validator: (value: string) => string | undefined;
    setValidationError: (label: string, error: boolean) => void;
}

const RenderInputField: React.FC<InputFieldProps> = ({ label, value, setValue, validator, setValidationError }) => {
    const [error, setError] = React.useState<string | undefined>(undefined);

    const handleChange = (data: { name?: string; value?: string }) => {
        const newValue = data.value || "";
        const validationError = validator(newValue);
        setError(validationError);
        validationError ? setValidationError(label, true) : setValidationError(label, false);
        setValue(newValue);
    };

    return <InputField label={label} value={value} onChange={handleChange} validationText={error} error={!!error} />;
};

export default ReplicateUserFromTemplateFC;
