import { AppSettings, SettingsGroupColumn } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserProps } from "../entities/UserProps";
import { GroupColumnRepository } from "../repositories/GroupColumnRepository";
import { GroupColumnSetting } from "../entities/GroupColumn";
import { resolveColumns } from "./common/columns";

export class GetGroupColumnsUseCase {
    constructor(
        private columnRepository: GroupColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<GroupColumnSetting[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.columnRepository.get().map(groupColumnsPreferences => {
                return resolveColumns({
                    columnsConfig: this.getColumnsConfig(appSettings),
                    preferences: groupColumnsPreferences,
                    user: user,
                    buildColumn: (fieldName, state, position) => ({ fieldName, state, position }),
                });
            });
        });
    }

    // Without a configured source there is nothing to show in the description column
    private getColumnsConfig(appSettings: AppSettings): SettingsGroupColumn[] {
        return appSettings.hasUserGroupDescriptionSource
            ? appSettings.groupColumns
            : appSettings.groupColumns.filter(column => column.field !== "description");
    }
}
