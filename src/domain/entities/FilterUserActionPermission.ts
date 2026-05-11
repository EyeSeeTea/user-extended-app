import i18n from "../../utils/i18n";

export const UI_USER_ACTION_LIST = [
    {
        code: "filterActive",
        label: i18n.t('Show "Filter by active/inactive users"'),
    },
    {
        code: "filterTwoFactorAuth",
        label: i18n.t('Show "Filter by enabled/disabled 2FA"'),
    },
    {
        code: "filterExternalAuth",
        label: i18n.t('Show "Filter by enabled/disabled external authentication"'),
    },
    {
        code: "filterRoles",
        label: i18n.t('Show "Filter by role"'),
    },
    {
        code: "filterUserGroups",
        label: i18n.t('Show "Filter by Groups"'),
    },
    {
        code: "filterOrgUnits",
        label: i18n.t('Show "Filter by organization units capture"'),
    },
    {
        code: "filterOrgUnitsView",
        label: i18n.t('Show "Filter by organization units output"'),
    },
    {
        code: "filterOrgUnitsSearch",
        label: i18n.t('Show "Filter by organization units search"'),
    },
    {
        code: "import",
        label: i18n.t("Show Import Users"),
    },
    {
        code: "exportJson",
        label: i18n.t("Show Export to JSON"),
    },
    {
        code: "exportCsv",
        label: i18n.t("Show Export to CSV"),
    },
] as const;

export type UIUserActionType = typeof UI_USER_ACTION_LIST[number]["code"];
export type UserUiActionAccess = Record<UIUserActionType, { visible: boolean }>;

export const UI_USER_GROUP_ACTION_LIST = [
    {
        code: "filterUsersInOrgUnit",
        label: i18n.t("Show only users assigned to my organization unit and below"),
    },
    {
        code: "filterHideNotApplicableUserGroups",
        label: i18n.t("Hide not applicable user groups"),
    },
    {
        code: "filterUsers",
        label: i18n.t("Filter by Users"),
    },
    {
        code: "exportCsv",
        label: i18n.t("Show Export to CSV"),
    },
    {
        code: "exportJson",
        label: i18n.t("Show Export to JSON"),
    },
] as const;

export type UIUserGroupActionType = typeof UI_USER_GROUP_ACTION_LIST[number]["code"];
export type UserGroupUiActionAccess = Record<UIUserGroupActionType, { visible: boolean; defaultValue?: boolean }>;

export const UI_USER_ROLE_ACTION_LIST = [
    {
        code: "filterUsersInOrgUnit",
        label: i18n.t("Show only users assigned to my organization unit and below"),
    },
    {
        code: "filterHideNotApplicableUserRoles",
        label: i18n.t("Hide not applicable user roles"),
    },
    {
        code: "filterUsers",
        label: i18n.t("Filter by Users"),
    },
] as const;

export type UIUserRoleActionType = typeof UI_USER_ROLE_ACTION_LIST[number]["code"];
export type UserRoleUiActionAccess = Record<UIUserRoleActionType, { visible: boolean; defaultValue?: boolean }>;

export const UI_DASHBOARD_ACTION_LIST = [
    {
        code: "filterUsersInOrgUnit",
        label: i18n.t("Show only users assigned to my organization unit and below"),
    },
    {
        code: "filterUsers",
        label: i18n.t("Filter by Users"),
    },
    {
        code: "filterOwners",
        label: i18n.t("Filter by Owners"),
    },
] as const;

export type UIDashboardActionType = typeof UI_DASHBOARD_ACTION_LIST[number]["code"];
export type DashboardUiActionAccess = Record<UIDashboardActionType, { visible: boolean; defaultValue?: boolean }>;
