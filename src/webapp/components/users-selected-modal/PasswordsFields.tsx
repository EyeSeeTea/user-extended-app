import React from "react";
import styled from "styled-components";
import { InputField } from "@dhis2/ui";
import { usePasswordsFields } from "./usePasswordsFields";
import i18n from "../../../utils/i18n";
import { LinearProgress } from "material-ui";

interface PasswordFieldsProps {
    password: string;
    confirmPassword: string;
    onPasswordChange: (password: string, confirmPassword: string) => void;
    onValidationChange: (isValid: boolean) => void;
}

export const PasswordsFields: React.FC<PasswordFieldsProps> = React.memo(props => {
    const { onPasswordChange, onValidationChange, password, confirmPassword } = props;

    const {
        errors,
        touched,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handlePasswordBlur,
        handleConfirmPasswordBlur,
        isLoading,
    } = usePasswordsFields({ onPasswordChange, onValidationChange, password, confirmPassword });

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
                    disabled={isLoading}
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
                    disabled={isLoading || !password.length}
                />
            </FieldContainer>

            {isLoading && <LinearProgress />}

            {/* Commented for reference, but was requested to verify delegating on DHIS2 instead */}
            {/* <PasswordRequirements password={password} /> */}
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-inline-size: 400px;
`;

const FieldContainer = styled.div`
    display: flex;
    flex-direction: column;
`;
