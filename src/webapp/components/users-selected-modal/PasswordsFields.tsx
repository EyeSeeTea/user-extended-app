import React from "react";
import styled from "styled-components";
import { InputField } from "@dhis2/ui";

import { PasswordRequirements } from "./PasswordRequirements";
import { usePasswordsFields } from "./usePasswordsFields";
import i18n from "../../../locales";

interface PasswordFieldsProps {
    onPasswordChange: (password: string, confirmPassword: string) => void;
    onValidationChange: (isValid: boolean) => void;
}

export const PasswordsFields: React.FC<PasswordFieldsProps> = React.memo(({ onPasswordChange, onValidationChange }) => {
    const {
        password,
        confirmPassword,
        errors,
        touched,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handlePasswordBlur,
        handleConfirmPasswordBlur,
    } = usePasswordsFields({ onPasswordChange, onValidationChange });

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
