import React from "react";
import { Box, Button, DialogActions, FormControlLabel, Switch, Typography, useTheme } from "@material-ui/core";
import { InfoOutlined as InfoOutlinedIcon } from "@material-ui/icons";
import { Sharing } from "@eyeseetea/d2-ui-components";
import { AppSettings, UI_USER_ACTION_LIST } from "../../../domain/entities/AppSettings";
import { useSharingSettings } from "./useSharingSettings";
import { usePermissionsPage } from "./usePermissionsPage";
import { SharingActions } from "./SharingActions";
import i18n from "../../../utils/i18n";
import { HideEntities } from "./HideEntities";
import { OrgUnitSelectorModal } from "../org-unit-selector-modal/OrgUnitSelectorModal";

type PermissionsPageProps = {
    onSave: (appSettings: AppSettings) => void;
    onClose: () => void;
    permissionsGroup: "users" | "global";
};

export const PermissionsPage = React.memo((props: PermissionsPageProps) => {
    const { onSave, onClose, permissionsGroup } = props;

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
        updateRootOrgUnitIds,
        rootOrgUnitIds,
        updateCustomRootOrgUnitSwitch,
        updateUiActionsAccess,
    } = usePermissionsPage(onSave, permission);

    const theme = useTheme();

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
            <Box
                display="flex"
                flexDirection="column"
                flexWrap="wrap"
                paddingX={theme.spacing(0.25)}
                maxWidth="calc(85% - 1em)"
            >
                {permissionsGroup === "global" ? (
                    <>
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
                                    checked={formState.showCustomRootOrgUnits}
                                    onChange={updateCustomRootOrgUnitSwitch}
                                />
                            }
                            label={i18n.t("Configure custom root org. units on advanced filters")}
                        />

                        {formState.showCustomRootOrgUnits && (
                            <Box marginTop={1} marginBottom={3}>
                                <OrgUnitSelectorModal onSave={updateRootOrgUnitIds} orgUnitIds={rootOrgUnitIds} />
                            </Box>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formState.showSharingSettings}
                                    onChange={event =>
                                        !showSharingSettings &&
                                        updateFormState(event.target.checked, "showSharingSettings")
                                    }
                                    disabled={showSharingSettings}
                                />
                            }
                            label={
                                <Box display="flex" alignItems="center" gridColumnGap={theme.spacing(0.75)}>
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
                    </>
                ) : (
                    <>
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
                                    checked={formState.showOnlyUsersInTheirOrgUnits}
                                    onChange={event =>
                                        updateFormState(event.target.checked, "showOnlyUsersInTheirOrgUnits")
                                    }
                                />
                            }
                            label={i18n.t("Show only users assigned to users organisation units")}
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
                            label={
                                <Box display="flex" alignItems="center" gridColumnGap={theme.spacing(0.75)}>
                                    {i18n.t("Actions available for all users")}
                                    <InfoOutlinedIcon
                                        fontSize="small"
                                        color="disabled"
                                        titleAccess={i18n.t(
                                            "All actions will be available for administrators (but still subject to the circumstances that need to be met for each action). Eg: 'Enable' action will not be available if selected users are already enabled.",
                                            {
                                                nsSeparator: false,
                                            }
                                        )}
                                    />
                                </Box>
                            }
                        />

                        {!formState.actionsArePublic && (
                            <SharingActions
                                actionsPermissions={actionsPermissions}
                                setActionsPermissions={setActionsPermissions}
                            />
                        )}

                        <Box
                            marginTop={2}
                            marginBottom={2}
                            display="flex"
                            flexDirection="column"
                            gridRowGap={theme.spacing(1)}
                        >
                            <Typography variant="h6">{i18n.t("Show/Hide User Actions")}</Typography>
                            {UI_USER_ACTION_LIST.map(action => (
                                <FormControlLabel
                                    key={action.code}
                                    control={
                                        <Switch
                                            checked={formState.uiUserActionsAccess[action.code].visible}
                                            onChange={event => updateUiActionsAccess(action.code, event.target.checked)}
                                        />
                                    }
                                    label={action.label}
                                />
                            ))}
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
});

const sharingOptions = {
    dataSharing: false,
    publicSharing: false,
    externalSharing: false,
    permissionPicker: false,
};
