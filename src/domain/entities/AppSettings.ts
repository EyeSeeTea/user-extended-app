import { Struct } from "./generic/Struct";
import { Permission } from "./Permission";
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

export type ActionsPermissions = Record<UserAction, Permission>;

export type ColumnSettingValue = "visible" | "disabled" | "optional";

export type SettingsUserColumn = { field: UserColumns; value: ColumnSettingValue };

export class AppSettings extends Struct<AppSettingsAttr>() {
    static emptySettings(): AppSettings {
        return this.create({
            columns: [],
            showOnlyActiveUsers: false,
            showOnlyUsersOrgUnits: false,
            showFeedback: true,
            settingsAccess: publicPermission,
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
        return Object.values(this.actionsAccess).every(permission => permission.publicAccess.startsWith("rw"));
    }

    isActionPublic(action: UserAction): boolean {
        return this.actionsAccess[action].publicAccess.startsWith("rw");
    }
}

const publicPermission = { publicAccess: "rw------", users: [], userGroups: [] };
