import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { User } from "../../../domain/entities/User";
import i18n from "../../../locales";

interface UseUsersSetPasswordModalProps {
    users: User[];
    isOpen: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

export function useUsersSetPasswordModal(props: UseUsersSetPasswordModalProps) {
    const { users, isOpen, onSuccess, onCancel } = props;
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isValid, setIsValid] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const user = React.useMemo(() => {
        if (!users[0]) throw new Error("One user must be selected to set a password.");
        return users[0];
    }, [users]);

    const handlePasswordChange = React.useCallback((newPassword: string, newConfirmPassword: string) => {
        setPassword(newPassword);
        setConfirmPassword(newConfirmPassword);
    }, []);

    const save = React.useCallback(async () => {
        if (!isValid) {
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

    const resetForm = React.useCallback(() => {
        setPassword("");
        setConfirmPassword("");
        setIsValid(false);
    }, []);

    const cancel = React.useCallback(() => {
        resetForm();
        onCancel();
    }, [onCancel]);

    React.useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen]);

    return {
        user,
        isValid,
        isLoading,
        handlePasswordChange,
        handleValidationChange: setIsValid,
        save,
        cancel,
    };
}
