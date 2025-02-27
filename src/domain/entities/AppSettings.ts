import { Struct } from "./generic/Struct";
import { Permission, PublicPermission } from "./Permission";
import { UserColumns } from "./User";
import { assignValueToAllActions, UserAction } from "./UserAction";

type AppSettingsAttr = {
    columns: SettingsUserColumn[];
    showOnlyActiveUsers: boolean;
    showOnlyUsersOrgUnits: boolean;
    showFeedback: boolean;
    settingsAccess: Permission;
    actionsAccess: ActionsPermissions;
};

export type ActionsPermissions = Record<UserAction, PublicPermission>;

export type ColumnSettingValue = "visible" | "disabled" | "optional";

export type SettingsUserColumn = { field: UserColumns; value: ColumnSettingValue };

export class AppSettings extends Struct<AppSettingsAttr>() {
    static emptySettings(): AppSettings {
        return this.create({
            columns: [],
            showOnlyActiveUsers: false,
            showOnlyUsersOrgUnits: false,
            showFeedback: true,
            settingsAccess: emptyPermission,
            actionsAccess: assignValueToAllActions(publicPermission),
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
}

const emptyPermission: Permission = new Permission({ users: [], userGroups: [] });
export const publicPermission: PublicPermission = PublicPermission.public();
