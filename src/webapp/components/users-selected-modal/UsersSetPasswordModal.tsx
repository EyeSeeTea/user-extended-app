import { ConfirmationDialog, useSnackbar } from "@eyeseetea/d2-ui-components";
import React, { useState, useCallback } from "react";
import { UsersSelectedModalProps } from "./UsersSelectedModal";
import { PasswordsFields, PasswordValidationErrors } from "./PasswordsFields";
import { useAppContext } from "../../contexts/app-context";
import i18n from "../../../locales";

export const UsersSetPasswordModal: React.FC<UsersSelectedModalProps> = React.memo(props => {
    const { users, isOpen, onCancel, onSuccess } = props;
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isValid, setIsValid] = useState(false);
    const [validationErrors, setValidationErrors] = useState<PasswordValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const user = React.useMemo(() => {
        if (!users[0]) throw new Error("One user must be selected to set a password.");
        return users[0];
    }, [users]);

    const handlePasswordChange = useCallback((newPassword: string, newConfirmPassword: string) => {
        setPassword(newPassword);
        setConfirmPassword(newConfirmPassword);
    }, []);

    const handleValidationChange = useCallback((valid: boolean, errors: PasswordValidationErrors) => {
        setIsValid(valid);
        setValidationErrors(errors);
    }, []);

    const onSave = useCallback(async () => {
        if (!isValid || !password || password !== confirmPassword) {
            snackbar.error(i18n.t("Please ensure all password requirements are met and passwords match"));
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Replace with actual compositionRoot password setting logic
            // For now, this is a placeholder that simulates the API call
            // The real implementation will use compositionRoot.users.setPassword(user.id, password)
            // or similar method when the use case is implemented

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            snackbar.success(
                i18n.t("Password has been set successfully for {{username}}", {
                    username: user.username,
                })
            );

            onSuccess();
        } catch (error) {
            console.error("Error setting password:", error);
            snackbar.error(i18n.t("Failed to set password. Please try again."));
        } finally {
            setIsLoading(false);
        }
    }, [isValid, password, confirmPassword, user.username, onSuccess, snackbar]);

    const handleCancel = useCallback(() => {
        // Reset form state when canceling
        setPassword("");
        setConfirmPassword("");
        setIsValid(false);
        setValidationErrors({});
        onCancel();
    }, [onCancel]);

    // Reset form state when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setPassword("");
            setConfirmPassword("");
            setIsValid(false);
            setValidationErrors({});
        }
    }, [isOpen]);

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            onSave={onSave}
            onCancel={handleCancel}
            title={i18n.t("Set password for {{username}}", { username: user.username })}
            description={
                <PasswordsFields onPasswordChange={handlePasswordChange} onValidationChange={handleValidationChange} />
            }
            saveText={i18n.t("Set Password")}
            disableSave={!isValid || isLoading}
        />
    );
});
