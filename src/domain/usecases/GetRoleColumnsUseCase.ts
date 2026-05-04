import _ from "lodash";
import { AppSettings, SettingsRoleColumn } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { isSuperAdmin, UserProps } from "../entities/UserProps";
import { Maybe } from "../../types/utils";
import { RoleColumnRepository } from "../repositories/RoleColumnRepository";
import { RoleColumnType, RoleColumnSetting } from "../entities/RoleColumn";

export class GetRoleColumnsUseCase {
    constructor(
        private roleColumnRepository: RoleColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<RoleColumnSetting[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.getColumnsFromSettings(appSettings, user);
        });
    }

    private getColumnsFromSettings(appSettings: AppSettings, user: UserProps): FutureData<RoleColumnSetting[]> {
        const columnsConfig = appSettings.roleColumns;

        return this.roleColumnRepository.get().map(roleColumnsPreferences => {
            const preferencesMap = _.keyBy(roleColumnsPreferences, col => col.fieldName);
            const isSuperAdminUser = isSuperAdmin(user);

            const columns = _(columnsConfig)
                .map(columnConfig => {
                    const existingColumn = preferencesMap[columnConfig.field];

                    return this.processColumnByValue(columnConfig, existingColumn, isSuperAdminUser);
                })
                .compact()
                .orderBy(col => (col.position === -1 ? Infinity : -col.position), "desc")
                .value();

            return columns;
        });
    }

    private processColumnByValue(
        columnConfig: SettingsRoleColumn,
        existingColumn: Maybe<RoleColumnSetting>,
        isSuperAdmin: boolean
    ): Maybe<RoleColumnSetting> {
        switch (columnConfig.value) {
            case "disabled":
                // Disabled columns are excluded from the result
                return undefined;

            case "optional":
                // If exists in preferences, respect its state; otherwise add as unselected
                return existingColumn ?? this.buildColumn(columnConfig.field, "unselected", -1);

            case "visible":
                // If exists in preferences, respect its state; otherwise add as selected
                return existingColumn ?? this.buildColumn(columnConfig.field, "selected", -1);

            case "mandatory": {
                const mandatoryState = isSuperAdmin ? existingColumn?.state ?? "selected" : "selected-disabled";
                // Always add as selected-disabled regardless of preferences
                return this.buildColumn(columnConfig.field, mandatoryState, existingColumn?.position ?? -1);
            }

            default:
                return undefined;
        }
    }

    private buildColumn(
        fieldName: RoleColumnType,
        state: RoleColumnSetting["state"],
        position: number
    ): RoleColumnSetting {
        return { fieldName, state, position };
    }
}
