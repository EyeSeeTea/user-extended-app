import React from "react";
import styled from "styled-components";
import { InputField } from "@dhis2/ui";

import i18n from "../../../locales";
import { PasswordRequirements } from "./PasswordRequirements";
import { validatePasswordRules } from "./passwordValidation";

interface PasswordFieldsProps {
    onPasswordChange: (password: string, confirmPassword: string) => void;
    onValidationChange: (isValid: boolean) => void;
}

export interface PasswordValidationErrors {
    password?: string;
    confirmPassword?: string;
    match?: string;
}

export const PasswordsFields: React.FC<PasswordFieldsProps> = React.memo(({ onPasswordChange, onValidationChange }) => {
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [errors, setErrors] = React.useState<PasswordValidationErrors>(emptyErrors);
    const [touched, setTouched] = React.useState({ password: false, confirmPassword: false });

    const validatePasswords = React.useCallback(
        (pwd: string, confirmPwd: string, touchedFields: typeof touched) => {
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
            return isValid;
        },
        [onValidationChange]
    );

    const { handlePasswordChange, handleConfirmPasswordChange, handlePasswordBlur, handleConfirmPasswordBlur } =
        React.useMemo(
            () => ({
                handlePasswordChange: ({ value }: { value?: string }) => {
                    const newValue = value || "";
                    setPassword(newValue);
                    const newTouched = { ...touched, password: true };
                    setTouched(newTouched);
                    validatePasswords(newValue, confirmPassword, newTouched);
                    onPasswordChange(newValue, confirmPassword);
                },
                handleConfirmPasswordChange: ({ value }: { value?: string }) => {
                    const newValue = value || "";
                    setConfirmPassword(newValue);
                    const newTouched = { ...touched, confirmPassword: true };
                    setTouched(newTouched);
                    validatePasswords(password, newValue, newTouched);
                    onPasswordChange(password, newValue);
                },
                handlePasswordBlur: () => {
                    const newTouched = { ...touched, password: true };
                    setTouched(newTouched);
                    validatePasswords(password, confirmPassword, newTouched);
                },
                handleConfirmPasswordBlur: () => {
                    const newTouched = { ...touched, confirmPassword: true };
                    setTouched(newTouched);
                    validatePasswords(password, confirmPassword, newTouched);
                },
            }),
            [password, confirmPassword, touched, validatePasswords, onPasswordChange]
        );

    return (
        <Container>
            <FieldContainer>
                <InputField
                    name="password"
                    type="password"
                    label={i18n.t("New Password")}
                    value={password}
                    error={!!(touched.password && errors.password)}
                    validationText={touched.password ? errors.password : undefined}
                    required
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                />
            </FieldContainer>

            <FieldContainer>
                <InputField
                    name="confirmPassword"
                    type="password"
                    label={i18n.t("Confirm New Password")}
                    value={confirmPassword}
                    error={!!(touched.confirmPassword && (errors.confirmPassword || errors.match))}
                    validationText={touched.confirmPassword ? errors.confirmPassword || errors.match : undefined}
                    required
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                />
            </FieldContainer>

            <PasswordRequirements password={password} />
        </Container>
    );
});

const emptyErrors: PasswordValidationErrors = {
    password: undefined,
    confirmPassword: undefined,
    match: undefined,
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 400px;
`;

const FieldContainer = styled.div`
    display: flex;
    flex-direction: column;
`;
