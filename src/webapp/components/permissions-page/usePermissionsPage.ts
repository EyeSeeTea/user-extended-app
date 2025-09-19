import _ from "lodash";
import React from "react";
import { AppSettings, markAllActionsPublic } from "../../../domain/entities/AppSettings";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { Permission } from "../../../domain/entities/Permission";
import { Id } from "../../../domain/entities/Ref";

export const usePermissionsPage = (onSave: (appSettings: AppSettings) => void, permission: Permission) => {
    const { appSettings } = useAppSettingsContext();

    const showSharingSettings = !_.isEmpty(permission.users) || !_.isEmpty(permission.userGroups);
    const showHideOptions = !appSettings.isHideUserRelatedConfigurationEmpty();
    const showHideOrgUnits = !appSettings.isHideOrgUnitsEmpty();

    const [formState, setForm] = React.useState<FormType>({
        activeUsers: appSettings.showOnlyActiveUsers,
        feedbackButton: appSettings.showFeedback,
        showSharingSettings: showSharingSettings,
        actionsArePublic: appSettings.areAllActionsPublic(),
        showHideOptions: showHideOptions,
        showHideOrgUnits: showHideOrgUnits,
    });

    const [actionsPermissions, setActionsPermissions] = React.useState(appSettings.actionsAccess);
    const [usersToHide, setUsersToHide] = React.useState(appSettings.hide.users);
    const [userGroupsToHide, setUserGroupsToHide] = React.useState(appSettings.hide.userGroups);
    const [userRolesToHide, setUserRolesToHide] = React.useState(appSettings.hide.userRoles);
    const [orgUnitsToHide, _setOrgUnitsToHide] = React.useState(appSettings.hide.orgUnits);

    const updateHideOptions = React.useCallback(
        (hideOptions: Partial<{ users: Id[]; userGroups: Id[]; userRoles: Id[] }>) => {
            const { users, userGroups, userRoles } = hideOptions;

            if (users) setUsersToHide(users);
            if (userGroups) setUserGroupsToHide(userGroups);
            if (userRoles) setUserRolesToHide(userRoles);
        },
        []
    );

    const updateFormState = (value: boolean, field: keyof FormType) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const onSaveSettings = React.useCallback(() => {
        onSave(
            AppSettings.create({
                ...appSettings,
                showOnlyActiveUsers: formState.activeUsers,
                showFeedback: formState.feedbackButton,
                settingsAccess: permission,
                actionsAccess: formState.actionsArePublic ? markAllActionsPublic() : actionsPermissions,
                hide: {
                    users: formState.showHideOptions ? usersToHide : [],
                    userGroups: formState.showHideOptions ? userGroupsToHide : [],
                    userRoles: formState.showHideOptions ? userRolesToHide : [],
                    orgUnits: formState.showHideOrgUnits ? orgUnitsToHide : [],
                },
            })
        );
    }, [
        onSave,
        appSettings,
        formState.activeUsers,
        formState.feedbackButton,
        formState.showHideOptions,
        formState.showHideOrgUnits,
        formState.actionsArePublic,
        permission,
        actionsPermissions,
        usersToHide,
        userGroupsToHide,
        userRolesToHide,
        orgUnitsToHide,
    ]);

    return {
        formState,
        updateFormState,
        onSaveSettings,
        showSharingSettings,
        actionsPermissions,
        setActionsPermissions,
        hideOptions: {
            users: usersToHide,
            userGroups: userGroupsToHide,
            userRoles: userRolesToHide,
        },
        updateHideOptions,
    };
};

type FormType = {
    activeUsers: boolean;
    feedbackButton: boolean;
    showSharingSettings: boolean;
    actionsArePublic: boolean;
    showHideOptions: boolean;
    showHideOrgUnits: boolean;
};
