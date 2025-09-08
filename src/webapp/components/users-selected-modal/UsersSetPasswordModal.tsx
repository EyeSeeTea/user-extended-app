import React from "react";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import { UsersSelectedModalProps } from "./UsersSelectedModal";
import { PasswordsFields } from "./PasswordsFields";
import { useUsersSetPasswordModal } from "./useUsersSetPasswordModal";
import i18n from "../../../locales";

export const UsersSetPasswordModal: React.FC<UsersSelectedModalProps> = React.memo(props => {
    const { users, isOpen, onCancel, onSuccess } = props;

    const { user, isValid, isLoading, handlePasswordChange, handleValidationChange, save, cancel } =
        useUsersSetPasswordModal({
            users,
            isOpen,
            onSuccess,
            onCancel,
        });

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            onSave={save}
            onCancel={cancel}
            title={i18n.t("Set password for {{username}}", { username: user.username })}
            description={
                <PasswordsFields onPasswordChange={handlePasswordChange} onValidationChange={handleValidationChange} />
            }
            saveText={i18n.t("Set Password")}
            disableSave={!isValid || isLoading}
        />
    );
});
