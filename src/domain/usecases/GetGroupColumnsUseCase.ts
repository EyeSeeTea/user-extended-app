import _ from "lodash";
import { AppSettings, SettingsGroupColumn } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { isSuperAdmin, UserProps } from "../entities/UserProps";
import { Maybe } from "../../types/utils";
import { GroupColumnRepository } from "../repositories/GroupColumnRepository";
import { GroupColumnSetting, GroupColumnType } from "../entities/GroupColumn";

export class GetGroupColumnsUseCase {
    constructor(
        private columnRepository: GroupColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<GroupColumnSetting[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.getColumnsFromSettings(appSettings, user);
        });
    }

    private getColumnsFromSettings(appSettings: AppSettings, user: UserProps): FutureData<GroupColumnSetting[]> {
        // Without a configured source there is nothing to show in the description column
        const columnsConfig = appSettings.hasUserGroupDescriptionSource
            ? appSettings.groupColumns
            : appSettings.groupColumns.filter(column => column.field !== "description");

        return this.columnRepository.get().map(roleColumnsPreferences => {
            const preferencesMap = _.keyBy(roleColumnsPreferences, col => col.fieldName);
            const isSuperAdminUser = isSuperAdmin(user);

            const columns = _(columnsConfig)
                .map((columnConfig, index) => {
                    const existingColumn = preferencesMap[columnConfig.field];

                    return this.processColumnByValue(columnConfig, existingColumn, isSuperAdminUser, index);
                })
                .compact()
                .orderBy(col => col.position, "asc")
                .value();

            return columns;
        });
    }

    private processColumnByValue(
        columnConfig: SettingsGroupColumn,
        existingColumn: Maybe<GroupColumnSetting>,
        isSuperAdmin: boolean,
        // Position in the settings, used for columns the user has no preference for yet
        defaultPosition: number
    ): Maybe<GroupColumnSetting> {
        switch (columnConfig.value) {
            case "disabled":
                // Disabled columns are excluded from the result
                return undefined;

            case "optional":
                // If exists in preferences, respect its state; otherwise add as unselected
                return existingColumn ?? this.buildColumn(columnConfig.field, "unselected", defaultPosition);

            case "visible":
                // If exists in preferences, respect its state; otherwise add as selected
                return existingColumn ?? this.buildColumn(columnConfig.field, "selected", defaultPosition);

            case "mandatory": {
                const mandatoryState = isSuperAdmin ? existingColumn?.state ?? "selected" : "selected-disabled";
                // Always add as selected-disabled regardless of preferences
                return this.buildColumn(
                    columnConfig.field,
                    mandatoryState,
                    existingColumn?.position ?? defaultPosition
                );
            }

            default:
                return undefined;
        }
    }

    private buildColumn(
        fieldName: GroupColumnType,
        state: GroupColumnSetting["state"],
        position: number
    ): GroupColumnSetting {
        return { fieldName, state, position };
    }
}
