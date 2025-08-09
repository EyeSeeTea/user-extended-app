import React from "react";
import { Box, Button, DialogActions, FormControlLabel, Switch, useTheme } from "@material-ui/core";
import { InfoOutlined as InfoOutlinedIcon } from "@material-ui/icons";
import { Sharing } from "@eyeseetea/d2-ui-components";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useSharingSettings } from "./useSharingSettings";
import { usePermissionsPage } from "./usePermissionsPage";
import { SharingActions } from "./SharingActions";
import i18n from "../../../locales";
import { HideEntities } from "./HideEntities";

type PermissionsPageProps = { onSave: (appSettings: AppSettings) => void; onClose: () => void };

export const PermissionsPage = React.memo((props: PermissionsPageProps) => {
    const { onSave, onClose } = props;

    const { search, metaObject, onUpdateSharingOptions, permission } = useSharingSettings();
    const {
        formState,
        updateFormState,
        onSaveSettings,
        showSharingSettings,
        actionsPermissions,
        setActionsPermissions,
        hideOptions,
        updateHideOptions,
    } = usePermissionsPage(onSave, permission);

    const theme = useTheme();

    //FIXME: onChange events should be useCallback

    return (
        <Box component="section" padding={theme.spacing(0.25)} position="relative">
            <div className="sticky-actions">
                <DialogActions>
                    <Button onClick={onSaveSettings} color="primary" variant="contained">
                        {i18n.t("Save")}
                    </Button>
                    <Button onClick={onClose} color="secondary">
                        {i18n.t("Close")}
                    </Button>
                </DialogActions>
            </div>
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
                            checked={formState.activeUsers}
                            onChange={event => updateFormState(event.target.checked, "activeUsers")}
                        />
                    }
                    label={i18n.t("Show only active users")}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.showHideOptions}
                            onChange={event => updateFormState(event.target.checked, "showHideOptions")}
                        />
                    }
                    label={i18n.t("Hide users, user roles and user groups")}
                />

                {formState.showHideOptions && (
                    <Box marginTop={1} marginBottom={3}>
                        <HideEntities
                            selectedUsers={hideOptions.users}
                            selectedUserGroups={hideOptions.userGroups}
                            selectedUserRoles={hideOptions.userRoles}
                            updateHideEntities={updateHideOptions}
                        />
                    </Box>
                )}

                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.actionsArePublic}
                            onChange={event => updateFormState(event.target.checked, "actionsArePublic")}
                        />
                    }
                    label={i18n.t("Actions available for all users")}
                />

                {!formState.actionsArePublic && (
                    <SharingActions
                        actionsPermissions={actionsPermissions}
                        setActionsPermissions={setActionsPermissions}
                    />
                )}

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
                    label={
                        <Box display="flex" alignItems="flex-start" gridColumnGap={theme.spacing(0.5)}>
                            {i18n.t("Access to Settings Section")}
                            <InfoOutlinedIcon
                                fontSize="small"
                                color="disabled"
                                titleAccess={i18n.t(
                                    "Changes on 'Who has access' to settings will be reflected after page reload"
                                )}
                            />
                        </Box>
                    }
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
        </Box>
    );
});

const sharingOptions = {
    dataSharing: false,
    publicSharing: false,
    externalSharing: false,
    permissionPicker: false,
};
