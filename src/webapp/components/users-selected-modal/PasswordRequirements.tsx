import React from "react";
import styled from "styled-components";
import { passwordRequirements } from "./passwordValidation";
import i18n from "../../../locales";

interface PasswordRequirementsProps {
    password: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = React.memo(({ password }) => {
    return (
        <RequirementsContainer>
            <RequirementsTitle>{i18n.t("Password Requirements:")}</RequirementsTitle>
            <RequirementsList>
                {passwordRequirements.map(requirement => (
                    <RequirementItem key={requirement.key} valid={requirement.validator(password)}>
                        {requirement.text()}
                    </RequirementItem>
                ))}
            </RequirementsList>
        </RequirementsContainer>
    );
});

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
        color: ${props => (props.valid ? "#28a745" : "#6c757d")};
    }
`;
