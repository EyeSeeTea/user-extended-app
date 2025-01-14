import { Struct } from "./generic/Struct";
import { UserColumns } from "./User";

type AppSettingsAttr = { columns: SettingsUserColumn[]; showOnlyActiveUsers: boolean };
export type ColumnSettingValue = "visible" | "disabled" | "optional";

export type SettingsUserColumn = { field: UserColumns; value: ColumnSettingValue };

export class AppSettings extends Struct<AppSettingsAttr>() {
    static emptySettings(): AppSettings {
        return this.create({ columns: [], showOnlyActiveUsers: false });
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
