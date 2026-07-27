import React from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    DialogActions,
    FormControlLabel,
    Switch,
    Typography,
    useTheme,
} from "@material-ui/core";
import { InfoOutlined as InfoOutlinedIcon } from "@material-ui/icons";
import { Sharing } from "@eyeseetea/d2-ui-components";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useSharingSettings } from "./useSharingSettings";
import { usePermissionsPage } from "./usePermissionsPage";
import { SharingActions } from "./SharingActions";
import i18n from "../../../utils/i18n";
import { HideEntities } from "./HideEntities";
import { OrgUnitSelectorModal } from "../org-unit-selector-modal/OrgUnitSelectorModal";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {
    UI_DASHBOARD_ACTION_LIST,
    UI_USER_ACTION_LIST,
    UI_USER_GROUP_ACTION_LIST,
    UI_USER_ROLE_ACTION_LIST,
    UIDashboardActionType,
    UIUserGroupActionType,
    UIUserRoleActionType,
} from "../../../domain/entities/FilterUserActionPermission";

const BOOLEAN_USER_GROUP_FILTERS: readonly UIUserGroupActionType[] = [
    "filterUsersInOrgUnit",
    "filterHideNotApplicableUserGroups",
];
const BOOLEAN_USER_ROLE_FILTERS: readonly UIUserRoleActionType[] = [
    "filterUsersInOrgUnit",
    "filterHideNotApplicableUserRoles",
];
const BOOLEAN_DASHBOARD_FILTERS: readonly UIDashboardActionType[] = ["filterUsersInOrgUnit"];

type PermissionsPageProps = {
    onSave: (appSettings: AppSettings) => void;
    onClose: () => void;
    permissionsGroup: "users" | "global" | "filter";
    appSettings: AppSettings;
};

export const PermissionsPage = React.memo((props: PermissionsPageProps) => {
    const { onSave, onClose, permissionsGroup, appSettings } = props;

    const { search, metaObject, onUpdateSharingOptions, permission } = useSharingSettings(appSettings.settingsAccess);
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
        updateUiUserGroupActionsAccess,
        updateUiUserRoleActionsAccess,
        updateUiDashboardActionsAccess,
    } = usePermissionsPage(onSave, permission, appSettings);

    const theme = useTheme();

    const renderByPermissionsGroup = () => {
        switch (permissionsGroup) {
            case "global":
                return (
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
                );
            case "users":
                return (
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
                    </>
                );
            case "filter":
                return (
                    <>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">{i18n.t("Users")}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box
                                    marginTop={2}
                                    marginBottom={2}
                                    display="flex"
                                    flexDirection="column"
                                    gridRowGap={theme.spacing(1)}
                                >
                                    <Typography variant="h6">{i18n.t("Show/Hide Filters")}</Typography>
                                    {UI_USER_ACTION_LIST.map(action => (
                                        <div key={action.code}>
                                            {action.code === "import" && (
                                                <Typography variant="h6">{i18n.t("Show/Hide Actions")}</Typography>
                                            )}
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formState.uiUserActionsAccess[action.code].visible}
                                                        onChange={event =>
                                                            updateUiActionsAccess(action.code, event.target.checked)
                                                        }
                                                    />
                                                }
                                                label={action.label}
                                            />
                                        </div>
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">{i18n.t("User Groups")}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box
                                    marginTop={2}
                                    marginBottom={2}
                                    display="flex"
                                    flexDirection="column"
                                    gridRowGap={theme.spacing(1)}
                                >
                                    <Typography variant="h6">{i18n.t("Filters")}</Typography>
                                    <FiltersGrid>
                                        <FiltersGridHeader />
                                        {UI_USER_GROUP_ACTION_LIST.filter(
                                            a => a.code !== "exportCsv" && a.code !== "exportJson"
                                        ).map(action => {
                                            const entry = formState.uiUserGroupActionsAccess[action.code];
                                            const isBoolean = BOOLEAN_USER_GROUP_FILTERS.includes(action.code);
                                            return (
                                                <FilterRow
                                                    key={action.code}
                                                    label={action.label}
                                                    visible={entry.visible}
                                                    defaultValue={entry.defaultValue}
                                                    isBoolean={isBoolean}
                                                    onVisibleChange={v =>
                                                        updateUiUserGroupActionsAccess(action.code, "visible", v)
                                                    }
                                                    onDefaultChange={v =>
                                                        updateUiUserGroupActionsAccess(action.code, "defaultValue", v)
                                                    }
                                                />
                                            );
                                        })}
                                    </FiltersGrid>
                                    <Typography variant="h6">{i18n.t("Show/Hide Actions")}</Typography>
                                    {UI_USER_GROUP_ACTION_LIST.filter(
                                        a => a.code === "exportCsv" || a.code === "exportJson"
                                    ).map(action => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formState.uiUserGroupActionsAccess[action.code].visible}
                                                    onChange={event =>
                                                        updateUiUserGroupActionsAccess(
                                                            action.code,
                                                            "visible",
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            }
                                            label={action.label}
                                            key={action.code}
                                        />
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">{i18n.t("User Roles")}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box
                                    marginTop={2}
                                    marginBottom={2}
                                    display="flex"
                                    flexDirection="column"
                                    gridRowGap={theme.spacing(1)}
                                >
                                    <Typography variant="h6">{i18n.t("Filters")}</Typography>
                                    <FiltersGrid>
                                        <FiltersGridHeader />
                                        {UI_USER_ROLE_ACTION_LIST.map(action => {
                                            const entry = formState.uiUserRoleActionsAccess[action.code];
                                            const isBoolean = BOOLEAN_USER_ROLE_FILTERS.includes(action.code);
                                            return (
                                                <FilterRow
                                                    key={action.code}
                                                    label={action.label}
                                                    visible={entry.visible}
                                                    defaultValue={entry.defaultValue}
                                                    isBoolean={isBoolean}
                                                    onVisibleChange={v =>
                                                        updateUiUserRoleActionsAccess(action.code, "visible", v)
                                                    }
                                                    onDefaultChange={v =>
                                                        updateUiUserRoleActionsAccess(action.code, "defaultValue", v)
                                                    }
                                                />
                                            );
                                        })}
                                    </FiltersGrid>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">{i18n.t("Dashboards")}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box
                                    marginTop={2}
                                    marginBottom={2}
                                    display="flex"
                                    flexDirection="column"
                                    gridRowGap={theme.spacing(1)}
                                >
                                    <Typography variant="h6">{i18n.t("Filters")}</Typography>
                                    <FiltersGrid>
                                        <FiltersGridHeader />
                                        {UI_DASHBOARD_ACTION_LIST.map(action => {
                                            const entry = formState.uiDashboardActionsAccess[action.code];
                                            const isBoolean = BOOLEAN_DASHBOARD_FILTERS.includes(action.code);
                                            return (
                                                <FilterRow
                                                    key={action.code}
                                                    label={action.label}
                                                    visible={entry.visible}
                                                    defaultValue={entry.defaultValue}
                                                    isBoolean={isBoolean}
                                                    onVisibleChange={v =>
                                                        updateUiDashboardActionsAccess(action.code, "visible", v)
                                                    }
                                                    onDefaultChange={v =>
                                                        updateUiDashboardActionsAccess(action.code, "defaultValue", v)
                                                    }
                                                />
                                            );
                                        })}
                                    </FiltersGrid>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </>
                );
            default:
                return "";
        }
    };

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
                {renderByPermissionsGroup()}
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

const FiltersGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Box display="grid" gridTemplateColumns="1fr auto auto" alignItems="center" style={{ columnGap: 24, rowGap: 4 }}>
        {children}
    </Box>
);

const FiltersGridHeader: React.FC = () => (
    <>
        <span />
        <Typography variant="caption" align="center">
            {i18n.t("Visible")}
        </Typography>
        <Typography variant="caption" align="center">
            {i18n.t("Value")}
        </Typography>
    </>
);

type FilterRowProps = {
    label: string;
    visible: boolean;
    defaultValue?: boolean;
    isBoolean: boolean;
    onVisibleChange: (value: boolean) => void;
    onDefaultChange: (value: boolean) => void;
};

const FilterRow: React.FC<FilterRowProps> = ({
    label,
    visible,
    defaultValue,
    isBoolean,
    onVisibleChange,
    onDefaultChange,
}) => (
    <>
        <Typography component="span">{label}</Typography>
        <Switch checked={visible} onChange={e => onVisibleChange(e.target.checked)} />
        {isBoolean ? (
            <Switch checked={defaultValue ?? true} onChange={e => onDefaultChange(e.target.checked)} />
        ) : (
            <Typography component="span" align="center" color="textSecondary"></Typography>
        )}
    </>
);
