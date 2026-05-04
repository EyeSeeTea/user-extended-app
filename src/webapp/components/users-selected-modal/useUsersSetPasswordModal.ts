import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { User } from "../../../domain/entities/User";
import i18n from "../../../utils/i18n";

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
        const updatedUser = user.updatePassword(password);

        compositionRoot.users.setPassword(updatedUser).run(
            () => {
                snackbar.success(
                    i18n.t("Password has been set successfully for {{username}}", {
                        username: user.username,
                    })
                );
                onSuccess();
                setIsLoading(false);
            },
            error => {
                console.error("Error setting password:", error);
                snackbar.error(i18n.t("Failed to set password. Please try again."));
                setIsLoading(false);
            }
        );
    }, [isValid, password, onSuccess, snackbar, compositionRoot, user]);

    const resetForm = React.useCallback(() => {
        setPassword("");
        setConfirmPassword("");
        setIsValid(false);
    }, []);

    const cancel = React.useCallback(() => {
        resetForm();
        onCancel();
    }, [onCancel, resetForm]);

    React.useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen, resetForm]);

    return {
        user,
        isValid,
        isLoading,
        handlePasswordChange,
        handleValidationChange: setIsValid,
        save,
        cancel,
        password,
        confirmPassword,
    };
}
