import _ from "lodash";
import { Struct } from "./generic/Struct";
import { Permission } from "./Permission";
import { Id } from "./Ref";
import { UserColumns } from "./User";
import { UserAction, userActions } from "./UserAction";
import { ActionPermission } from "./ActionPermission";
import { fromPairs, getKeys } from "../../types/utils";
import { defaultRules, getInternalRulesForAction } from "./UserActionRule";
import { userColumns } from "./UserColumn";
import { isSuperAdmin, UserProps } from "./UserProps";
import i18n from "../../utils/i18n";

export const CONSTANT_SETTINGS_CODE = "user-extended-app-settings";

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

type AppSettingsAttr = {
    columns: SettingsUserColumn[];
    showOnlyActiveUsers: boolean;
    showFeedback: boolean;
    settingsAccess: Permission;
    actionsAccess: ActionsPermissions;
    showCustomRootOrgUnits: boolean;
    showOnlyUsersInTheirOrgUnits: boolean;
    rootOrgUnitIds: Id[];
    hide: {
        users: Id[];
        userGroups: Id[];
        userRoles: Id[];
    };
    status: AppSettingStatus;
    uiUserActionsAccess: UserUiActionAccess;
};

type AppSettingStatus = "active" | "inactive";
type UserUiActionAccess = Record<UIUserActionType, { visible: boolean }>;

export type ColumnSettingValue = "visible" | "disabled" | "optional" | "mandatory";
export type SettingsUserColumn = { field: UserColumns; value: ColumnSettingValue };
export type ActionsPermissions = Record<UserAction, ActionPermission>;
const defaultHideValues = { users: [], userGroups: [], userRoles: [], orgUnits: [] };

export class AppSettings extends Struct<AppSettingsAttr>() {
    static defaultSettings(status: AppSettingStatus): AppSettings {
        return this.create({
            columns: this.defaultColumns(),
            showOnlyActiveUsers: false,
            showFeedback: true,
            settingsAccess: emptyPermission,
            actionsAccess: defaultActions(),
            hide: defaultHideValues,
            status: status,
            rootOrgUnitIds: [],
            showCustomRootOrgUnits: false,
            showOnlyUsersInTheirOrgUnits: false,
            uiUserActionsAccess: this.defaultUiActions(),
        });
    }

    get isActive(): boolean {
        return this.status === "active";
    }

    updateStatus(status: AppSettingStatus): AppSettings {
        return this._update({ status });
    }

    updateColumns(columns: SettingsUserColumn[]): AppSettings {
        return this._update({ columns });
    }

    updateColumnField(columnToUpdate: UserColumns, value: ColumnSettingValue): SettingsUserColumn[] {
        return this.columns.map(column => {
            if (column.field === columnToUpdate) {
                return { ...column, value };
            }
            return column;
        });
    }

    areAllActionsPublic(): boolean {
        return Object.values(this.actionsAccess).every(permission => permission.isPublic);
    }

    isActionPublic(action: UserAction): boolean {
        return this.actionsAccess[action].isPublic;
    }

    isHideOrgUnitsEmpty(): boolean {
        return _.isEmpty(this.rootOrgUnitIds);
    }

    isHideUserRelatedConfigurationEmpty(): boolean {
        return _.isEmpty(this.hide.users) && _.isEmpty(this.hide.userGroups) && _.isEmpty(this.hide.userRoles);
    }

    validateUserAndBuild(user: UserProps): AppSettings {
        return isSuperAdmin(user) ? this._update({ hide: defaultHideValues }) : this;
    }

    private static defaultColumns(): SettingsUserColumn[] {
        return userColumns.map(column => ({ field: column, value: "optional" }));
    }

    private static defaultUiActions(): AppSettingsAttr["uiUserActionsAccess"] {
        return {
            filterActive: { visible: true },
            filterTwoFactorAuth: { visible: true },
            filterExternalAuth: { visible: true },
            filterRoles: { visible: true },
            filterUserGroups: { visible: true },
            filterOrgUnits: { visible: true },
            filterOrgUnitsView: { visible: true },
            filterOrgUnitsSearch: { visible: true },
            import: { visible: true },
            exportJson: { visible: true },
            exportCsv: { visible: true },
        };
    }
}

export function markAllActionsPublic() {
    const publicPermission = ActionPermission.public();
    const publicActions: ActionsPermissions = Object.assign(
        {},
        ...userActions.map(action => ({ [action]: publicPermission }))
    );

    return injectInternalRules(publicActions);
}

function instantiateActionsAccesses(): Record<UserAction, ActionPermission> {
    const publicPermission = ActionPermission.public();
    return fromPairs(
        userActions.map((action: UserAction): [UserAction, ActionPermission] => {
            const defaultActionPermission = publicPermission.updateRules(defaultRules[action]);
            return [action, defaultActionPermission];
        })
    );
}

export function removeInternalRules(actionsAccess: ActionsPermissions): ActionsPermissions {
    return _.mapValues(actionsAccess, permission => {
        const filteredRules = permission.getSelectableRules();
        return permission.updateRules(filteredRules);
    });
}

export function injectInternalRules(actionsAccess: ActionsPermissions): ActionsPermissions {
    const actionKeys = getKeys(actionsAccess);

    const updatedPermissions = actionKeys.map((action): [UserAction, ActionPermission] => {
        const newRules = _.uniq(actionsAccess[action].rules.concat(getInternalRulesForAction(action)));
        return [action, actionsAccess[action].updateRules(newRules)];
    });

    return fromPairs(updatedPermissions);
}

export function defaultActions(): ActionsPermissions {
    return instantiateActionsAccesses();
}

const emptyPermission: Permission = new Permission({ users: [], userGroups: [] });
