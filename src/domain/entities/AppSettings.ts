import { Struct } from "./generic/Struct";
import { Permission } from "./Permission";
import { UserColumns } from "./User";

type AppSettingsAttr = {
    columns: SettingsUserColumn[];
    showOnlyActiveUsers: boolean;
    showOnlyUsersOrgUnits: boolean;
    showFeedback: boolean;
    settingsAccess: Permission;
};

export type ColumnSettingValue = "visible" | "disabled" | "optional";

export type SettingsUserColumn = { field: UserColumns; value: ColumnSettingValue };

export class AppSettings extends Struct<AppSettingsAttr>() {
    static emptySettings(): AppSettings {
        return this.create({
            columns: [],
            showOnlyActiveUsers: false,
            showOnlyUsersOrgUnits: false,
            showFeedback: true,
            settingsAccess: { users: [], userGroups: [] },
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
}
