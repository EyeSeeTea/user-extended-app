import _ from "lodash";
import React from "react";
import { Box, Button, DialogActions, FormControlLabel, Switch, useTheme } from "@material-ui/core";
import { MetaObject, SharedObject, ShareUpdate, Sharing, SharingRule } from "@eyeseetea/d2-ui-components";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useAppContext } from "../../contexts/app-context";
import { NamedRef } from "../../../domain/entities/Ref";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import i18n from "../../../locales";

type PermissionsPageProps = { appSettings: AppSettings; onSave: (appSettings: AppSettings) => void };

export const PermissionsPage = React.memo((props: PermissionsPageProps) => {
    const { appSettings, onSave } = props;

    const theme = useTheme();
    const { search, metaObject, onUpdateSharingOptions, permission } = useSharingSettings();

    const showSharingSettings = !_.isEmpty(permission.users) || !_.isEmpty(permission.userGroups);

    const [formState, setForm] = React.useState<FormType>({
        activeUsers: appSettings.showOnlyActiveUsers,
        usersOrgUnits: appSettings.showOnlyUsersOrgUnits,
        feedbackButton: appSettings.showFeedback,
        showSharingSettings: showSharingSettings,
    });

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
            })
        );
    }, [onSave, appSettings, formState, permission]);

    return (
        <Box component="section" padding={theme.spacing(0.25)}>
            <Box display="flex" flexDirection="column" flexWrap="wrap" paddingX={theme.spacing(0.25)}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.feedbackButton}
                            onChange={event => updateFormState(event.target.checked, "feedbackButton")}
                        />
                    }
                    label={i18n.t("Show feedback button")}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.usersOrgUnits}
                            onChange={event => updateFormState(event.target.checked, "usersOrgUnits")}
                        />
                    }
                    label={i18n.t("Show only users assigned to users' organisation units")}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.activeUsers}
                            onChange={event => updateFormState(event.target.checked, "activeUsers")}
                        />
                    }
                    label={i18n.t("Show only active users")}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.showSharingSettings}
                            onChange={event =>
                                !showSharingSettings && updateFormState(event.target.checked, "showSharingSettings")
                            }
                            disabled={showSharingSettings}
                        />
                    }
                    label={i18n.t("Access to Settings Section")}
                />
            </Box>

            {formState.showSharingSettings && (
                <Box paddingX={theme.spacing(0.25)} marginBottom={2}>
                    <Sharing
                        meta={metaObject}
                        showOptions={sharingOptions}
                        onSearch={search}
                        onChange={onUpdateSharingOptions}
                    />
                </Box>
            )}

            <DialogActions>
                <Button onClick={onSaveSettings} color="primary" variant="contained">
                    {i18n.t("Save")}
                </Button>
            </DialogActions>
        </Box>
    );
});

type FormType = { activeUsers: boolean; usersOrgUnits: boolean; feedbackButton: boolean; showSharingSettings: boolean };

function useSharingSettings() {
    const { compositionRoot } = useAppContext();
    const { appSettings } = useAppSettingsContext();

    const [permission, setPermission] = React.useState(appSettings.settingsAccess);

    const sharedObject: SharedObject = React.useMemo(
        () => ({
            id: "",
            userAccesses: mapSharingRule(permission.users),
            userGroupAccesses: mapSharingRule(permission.userGroups),
            publicAccess: permission.publicAccess,
        }),
        [permission.publicAccess, permission.userGroups, permission.users]
    );

    const metaObject: MetaObject = React.useMemo(() => ({ object: sharedObject }), [sharedObject]);

    const search = React.useCallback(
        (query: string) => compositionRoot.users.searchUsersAndGroups(query).toPromise(),
        [compositionRoot]
    );

    const onUpdateSharingOptions = React.useCallback(
        /* Marked async only because it is typed that way on the Sharing props */
        async ({ userAccesses, userGroupAccesses }: ShareUpdate) => {
            const isLimited = !_.isEmpty(userAccesses) || !_.isEmpty(userGroupAccesses);

            setPermission(permissions => ({
                users: userAccesses ? mapAccessPermission(userAccesses) : permissions.users,
                userGroups: userGroupAccesses ? mapAccessPermission(userGroupAccesses) : permissions.userGroups,
                publicAccess: isLimited ? "--------" : "rw------",
            }));
        },
        [setPermission]
    );

    return { search, metaObject, onUpdateSharingOptions, permission };
}

const mapAccessPermission = (rules: SharingRule[]): NamedRef[] => {
    return rules.map(item => ({ id: item.id, name: item.displayName }));
};

const mapSharingRule = (rules: NamedRef[]): SharingRule[] => {
    return rules.map(item => ({ id: item.id, access: "rw------", displayName: item.name }));
};

const sharingOptions = {
    dataSharing: false,
    publicSharing: false,
    externalSharing: false,
    permissionPicker: false,
};
