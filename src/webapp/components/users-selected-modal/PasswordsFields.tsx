import React, { useState, useCallback } from "react";
import { InputField } from "@dhis2/ui";
import styled from "styled-components";
import i18n from "../../../locales";

interface PasswordFieldsProps {
    onPasswordChange: (password: string, confirmPassword: string) => void;
    onValidationChange: (isValid: boolean, errors: PasswordValidationErrors) => void;
}

export interface PasswordValidationErrors {
    password?: string;
    confirmPassword?: string;
    match?: string;
}

// Placeholder validation function - will be replaced with real implementation later
export const validatePasswordRules = (password: string): string | undefined => {
    if (!password) {
        return i18n.t("Password is required");
    }
    if (password.length < 8) {
        return i18n.t("Password must contain at least 8 characters");
    }
    if (password.length > 34) {
        return i18n.t("Password must not contain more than 34 characters");
    }
    if (!/(?=.*[a-z])/.test(password)) {
        return i18n.t("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        return i18n.t("Password must contain at least one UPPERCASE letter");
    }
    if (!/(?=.*[0-9])/.test(password)) {
        return i18n.t("Password must contain at least one digit (number)");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return i18n.t("Password must contain at least one special character (non-alphanumeric)");
    }
    return undefined;
};

export const PasswordsFields: React.FC<PasswordFieldsProps> = React.memo(({ onPasswordChange, onValidationChange }) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<PasswordValidationErrors>({});
    const [touched, setTouched] = useState({ password: false, confirmPassword: false });

    const validatePasswords = useCallback(
        (pwd: string, confirmPwd: string, touchedFields: typeof touched) => {
            const newErrors: PasswordValidationErrors = {};

            // Validate password rules
            if (touchedFields.password) {
                const passwordError = validatePasswordRules(pwd);
                if (passwordError) {
                    newErrors.password = passwordError;
                }
            }

            // Validate confirm password
            if (touchedFields.confirmPassword) {
                if (!confirmPwd) {
                    newErrors.confirmPassword = i18n.t("Please confirm your password");
                } else if (pwd !== confirmPwd) {
                    newErrors.match = i18n.t("Passwords do not match");
                }
            }

            setErrors(newErrors);

            const isValid = Object.keys(newErrors).length === 0 && !!pwd && !!confirmPwd && pwd === confirmPwd;
            onValidationChange(isValid, newErrors);

            return isValid;
        },
        [onValidationChange]
    );

    const handlePasswordChange = useCallback(
        (value: string) => {
            setPassword(value);
            const newTouched = { ...touched, password: true };
            setTouched(newTouched);

            validatePasswords(value, confirmPassword, newTouched);
            onPasswordChange(value, confirmPassword);
        },
        [confirmPassword, touched, validatePasswords, onPasswordChange]
    );

    const handleConfirmPasswordChange = useCallback(
        (value: string) => {
            setConfirmPassword(value);
            const newTouched = { ...touched, confirmPassword: true };
            setTouched(newTouched);

            validatePasswords(password, value, newTouched);
            onPasswordChange(password, value);
        },
        [password, touched, validatePasswords, onPasswordChange]
    );

    const handlePasswordBlur = useCallback(() => {
        const newTouched = { ...touched, password: true };
        setTouched(newTouched);
        validatePasswords(password, confirmPassword, newTouched);
    }, [password, confirmPassword, touched, validatePasswords]);

    const handleConfirmPasswordBlur = useCallback(() => {
        const newTouched = { ...touched, confirmPassword: true };
        setTouched(newTouched);
        validatePasswords(password, confirmPassword, newTouched);
    }, [password, confirmPassword, touched, validatePasswords]);

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
                    onChange={({ value }) => handlePasswordChange(value || "")}
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
                    onChange={({ value }) => handleConfirmPasswordChange(value || "")}
                    onBlur={handleConfirmPasswordBlur}
                />
            </FieldContainer>

            {/* Password requirements info */}
            <RequirementsContainer>
                <RequirementsTitle>{i18n.t("Password Requirements:")}</RequirementsTitle>
                <RequirementsList>
                    <RequirementItem valid={password.length >= 8}>
                        {i18n.t("Contain at least 8 characters")}
                    </RequirementItem>
                    <RequirementItem valid={password.length <= 34}>
                        {i18n.t("Not contain more than 34 characters")}
                    </RequirementItem>
                    <RequirementItem valid={/[^A-Za-z0-9]/.test(password)}>
                        {i18n.t("Contain at least one special character (non-alphanumeric)")}
                    </RequirementItem>
                    <RequirementItem valid={/(?=.*[A-Z])/.test(password)}>
                        {i18n.t("Contain at least one UPPERCASE character")}
                    </RequirementItem>
                    <RequirementItem valid={/(?=.*[a-z])/.test(password)}>
                        {i18n.t("Contain at least one lowercase character")}
                    </RequirementItem>
                    <RequirementItem valid={/(?=.*[0-9])/.test(password)}>
                        {i18n.t("Contain at least one digit (number)")}
                    </RequirementItem>
                </RequirementsList>
            </RequirementsContainer>
        </Container>
    );
});

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

const RequirementsContainer = styled.div`
    margin-top: 8px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
`;

const RequirementsTitle = styled.div`
    font-weight: 600;
    margin-bottom: 8px;
    color: #495057;
    font-size: 14px;
`;

const RequirementsList = styled.ul`
    margin: 0;
    padding-left: 16px;
`;

interface RequirementItemProps {
    valid: boolean;
}

const RequirementItem = styled.li<RequirementItemProps>`
    color: ${props => (props.valid ? "#28a745" : "#6c757d")};
    font-size: 13px;
    margin-bottom: 4px;

    &::marker {
        content: ${props => (props.valid ? "✓" : "•")};
        color: ${props => (props.valid ? "#28a745" : "#6c757d")};
    }
`;
