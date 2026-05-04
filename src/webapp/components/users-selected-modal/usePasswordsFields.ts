import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { validatePasswordRules } from "./passwordValidation";
import i18n from "../../../utils/i18n";

export interface PasswordValidationErrors {
    password?: string;
    confirmPassword?: string;
    match?: string;
}

interface UsePasswordsFieldsProps {
    password: string;
    confirmPassword: string;
    onPasswordChange: (password: string, confirmPassword: string) => void;
    onValidationChange: (isValid: boolean) => void;
}

const emptyErrors: PasswordValidationErrors = {
    password: undefined,
    confirmPassword: undefined,
    match: undefined,
};

export function usePasswordsFields(props: UsePasswordsFieldsProps) {
    const { onPasswordChange, onValidationChange, password, confirmPassword } = props;

    const snackbar = useSnackbar();

    const [errors, setErrors] = React.useState<PasswordValidationErrors>(emptyErrors);
    const [touched, setTouched] = React.useState({ password: false, confirmPassword: false });

    const validatePasswords = React.useCallback(
        (pwd: string, confirmPwd: string, touchedFields: typeof touched) => {
            snackbar.closeSnackbar();
            const newErrors: PasswordValidationErrors = {
                password: touchedFields.password ? validatePasswordRules(pwd) : undefined,
                confirmPassword:
                    touchedFields.confirmPassword && !confirmPwd ? i18n.t("Please confirm your password") : undefined,
                match:
                    touchedFields.confirmPassword && confirmPwd && pwd !== confirmPwd
                        ? i18n.t("Passwords do not match")
                        : undefined,
            };

            setErrors(newErrors);

            const isValid =
                Object.values(newErrors).every(error => error === undefined) &&
                !!pwd &&
                !!confirmPwd &&
                pwd === confirmPwd;

            onValidationChange(isValid);
        },
        [onValidationChange, snackbar]
    );

    const handlePasswordBlur = React.useCallback(() => {
        const newTouched = { ...touched, password: true };
        setTouched(newTouched);
        validatePasswords(password, confirmPassword, newTouched);
    }, [password, confirmPassword, touched, validatePasswords]);

    const handleConfirmPasswordBlur = React.useCallback(() => {
        const newTouched = { ...touched, confirmPassword: true };
        setTouched(newTouched);
        validatePasswords(password, confirmPassword, newTouched);
    }, [password, confirmPassword, touched, validatePasswords]);

    const handlePasswordChange = React.useCallback(
        ({ value }: { value?: string }) => {
            const newValue = value || "";
            const newTouched = { ...touched, password: true };
            setTouched(newTouched);
            validatePasswords(newValue, confirmPassword, newTouched);
            onPasswordChange(newValue, confirmPassword);
        },
        [confirmPassword, touched, validatePasswords, onPasswordChange]
    );

    const handleConfirmPasswordChange = React.useCallback(
        ({ value }: { value?: string }) => {
            const newValue = value || "";
            const newTouched = { ...touched, confirmPassword: true };
            setTouched(newTouched);
            validatePasswords(password, newValue, newTouched);
            onPasswordChange(password, newValue);
        },
        [password, touched, validatePasswords, onPasswordChange]
    );

    return {
        password,
        confirmPassword,
        errors,
        touched,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handlePasswordBlur,
        handleConfirmPasswordBlur,
    };
}
