import React from "react";
import _ from "lodash";
import { ConfirmationDialog, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";

import { useAppContext } from "../../contexts/app-context";
import { User } from "../../../domain/entities/User";
import i18n from "../../../locales";

type UsersRemoveModalProps = {
    isOpen: boolean;
    users: User[];
    onSuccess: () => void;
    onCancel: () => void;
    actionType: ActionType;
};

export type ActionType =
    | "remove"
    | "enable"
    | "disable"
    | "assign_to_org_units_capture"
    | "assign_to_org_units_output"
    | "assign_to_org_units_search"
    | "copy_in_user"
    | "reset_password";

// TODO: Add into i18n translation files (as will not be recognized by i18n-scanner)
function getMessagesByActionType(
    actionType: ActionType,
    t: typeof i18n.t
): { title: string; description: string; success: string } {
    switch (actionType) {
        case "remove":
            return { title: t("Remove users"), description: "remove", success: t("Users removed") };
        case "disable":
            return { title: t("Disable users"), description: "disable", success: t("Users disabled") };
        case "enable":
            return { title: t("Enable users"), description: "enable", success: t("Users enabled") };
        case "reset_password":
            return {
                title: t("Reset passwords"),
                description: t("reset the passwords for"),
                success: t("Passwords have been reset"),
            };
        default:
            return { title: "", description: "", success: "" };
    }
}

export function generateMessage(users: User[]) {
    const firstThreeUsers = _(users).take(3).value();
    const remainingUsersCount = users.length - firstThreeUsers.length;
    return remainingUsersCount > 0 ? `and ${remainingUsersCount} more` : "";
}

export function getFirstThreeUserNames(users: User[]): string[] {
    return _(users)
        .take(3)
        .map(user => user.username)
        .value();
}

export const UsersSelectedModal: React.FC<UsersRemoveModalProps> = ({
    actionType,
    users,
    isOpen,
    onCancel,
    onSuccess,
}) => {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const loading = useLoading();

    const messages = getMessagesByActionType(actionType, i18n.t);

    const firstThreeUsers = getFirstThreeUserNames(users);

    const onSuccessAction = () => {
        snackbar.success(
            i18n.t("{{actionSuccess}}. {{users}} {{remainingCount}}", {
                actionSuccess: messages.success,
                users: firstThreeUsers.join(", "),
                remainingCount: generateMessage(users),
            })
        );
        onSuccess();
        loading.hide();
    };

    const onErrorAction = (err: string) => {
        loading.hide();
        snackbar.error(err);
    };

    const onSave = () => {
        loading.show();
        if (actionType === "remove") {
            compositionRoot.users.remove(users).run(() => {
                onSuccessAction();
            }, onErrorAction);
        } else if (actionType === "disable" || actionType === "enable") {
            compositionRoot.users.saveStatus(users, { disabled: actionType === "disable" }).run(() => {
                onSuccessAction();
            }, onErrorAction);
        } else if (actionType === "reset_password") {
            onSuccessAction();
            compositionRoot.users.resetPasswords(users).run(() => {
                onSuccessAction();
            }, onErrorAction);
        }
    };

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            onSave={onSave}
            onCancel={onCancel}
            title={i18n.t("{{actionTitle}}", { actionTitle: messages.title })}
            description={i18n.t(
                "Are you sure you want to {{actionDescription}} the selected users? {{users}} {{remainingCount}}",
                {
                    actionDescription: messages.description,
                    users: firstThreeUsers.join(", "),
                    remainingCount: generateMessage(users),
                }
            )}
            saveText={i18n.t("Confirm")}
        />
    );
};
