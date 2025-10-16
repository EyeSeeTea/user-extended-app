import _ from "lodash";
import { Struct } from "./generic/Struct";
import { Permission } from "./Permission";
import { Id } from "./Ref";
import { isSuperAdmin, User, UserColumns } from "./User";
import { UserAction, userActions } from "./UserAction";
import { ActionPermission } from "./ActionPermission";
import { fromPairs, getKeys } from "../../types/utils";
import { defaultRules, getInternalRulesForAction } from "./UserActionRule";
import { userColumns } from "./UserColumn";

export const CONSTANT_SETTINGS_CODE = "user-extended-app-settings";

type AppSettingsAttr = {
    columns: SettingsUserColumn[];
    showOnlyActiveUsers: boolean;
    showFeedback: boolean;
    settingsAccess: Permission;
    actionsAccess: ActionsPermissions;
    hide: {
        users: Id[];
        userGroups: Id[];
        userRoles: Id[];
        orgUnits: Id[];
    };
};

export type ColumnSettingValue = "visible" | "disabled" | "optional" | "mandatory";
export type SettingsUserColumn = { field: UserColumns; value: ColumnSettingValue };
export type ActionsPermissions = Record<UserAction, ActionPermission>;
const defaultHideValues = { users: [], userGroups: [], userRoles: [], orgUnits: [] };

export class AppSettings extends Struct<AppSettingsAttr>() {
    static defaultSettings(): AppSettings {
        return this.create({
            columns: this.defaultColumns(),
            showOnlyActiveUsers: false,
            showFeedback: true,
            settingsAccess: emptyPermission,
            actionsAccess: defaultActions(),
            hide: defaultHideValues,
        });
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
        return _.isEmpty(this.hide.orgUnits);
    }

    isHideUserRelatedConfigurationEmpty(): boolean {
        return _.isEmpty(this.hide.users) && _.isEmpty(this.hide.userGroups) && _.isEmpty(this.hide.userRoles);
    }

    validateUserAndBuild(user: User): AppSettings {
        return isSuperAdmin(user) ? this._update({ hide: defaultHideValues }) : this;
    }

    private static defaultColumns(): SettingsUserColumn[] {
        return userColumns.map(column => ({ field: column, value: "optional" })); //FIXME (Next PR #232): This is making all "optional" as default
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
