import _ from "lodash";
import React from "react";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { Permission } from "../../../domain/entities/Permission";

export const usePermissionsPage = (onSave: (appSettings: AppSettings) => void, permission: Permission) => {
    const { appSettings } = useAppSettingsContext();

    const showSharingSettings = !_.isEmpty(permission.users) || !_.isEmpty(permission.userGroups);

    const [formState, setForm] = React.useState<FormType>({
        activeUsers: appSettings.showOnlyActiveUsers,
        usersOrgUnits: appSettings.showOnlyUsersOrgUnits,
        feedbackButton: appSettings.showFeedback,
        showSharingSettings: showSharingSettings,
        actionsArePublic: appSettings.areAllActionsPublic(),
    });

    const [actionsPermissions, setActionsPermissions] = React.useState(appSettings.actionsAccess);

    const updateFormState = (value: boolean, field: keyof FormType) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const onSaveSettings = React.useCallback(() => {
        onSave(
            AppSettings.create({
                ...appSettings,
                showOnlyActiveUsers: formState.activeUsers,
                showOnlyUsersOrgUnits: formState.usersOrgUnits,
                showFeedback: formState.feedbackButton,
                settingsAccess: permission,
                actionsAccess: actionsPermissions,
            })
        );
    }, [
        onSave,
        appSettings,
        formState.activeUsers,
        formState.usersOrgUnits,
        formState.feedbackButton,
        permission,
        actionsPermissions,
    ]);

    return {
        formState,
        updateFormState,
        onSaveSettings,
        showSharingSettings,
        actionsPermissions,
        setActionsPermissions,
    };
};

type FormType = {
    activeUsers: boolean;
    usersOrgUnits: boolean;
    feedbackButton: boolean;
    showSharingSettings: boolean;
    actionsArePublic: boolean;
};
