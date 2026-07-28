import _ from "lodash";
import { AppSettings, SettingsDashboardColumn } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { isSuperAdmin, UserProps } from "../entities/UserProps";
import { Maybe } from "../../types/utils";
import { DashboardColumnRepository } from "../repositories/DashboardColumnRepository";
import { DashboardColumnSetting, DashboardColumnType } from "../entities/DashboardColumn";

export class GetDashboardColumnsUseCase {
    constructor(
        private dashboardColumnRepository: DashboardColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<DashboardColumnSetting[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.getColumnsFromSettings(appSettings, user);
        });
    }

    private getColumnsFromSettings(appSettings: AppSettings, user: UserProps): FutureData<DashboardColumnSetting[]> {
        const columnsConfig = appSettings.dashboardColumns;

        return this.dashboardColumnRepository.get().map(roleColumnsPreferences => {
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
        columnConfig: SettingsDashboardColumn,
        existingColumn: Maybe<DashboardColumnSetting>,
        isSuperAdmin: boolean
    ): Maybe<DashboardColumnSetting> {
        switch (columnConfig.value) {
            case "disabled":
                // Excluded from the result, except for super admins: they get it as an optional column
                return isSuperAdmin
                    ? existingColumn ?? this.buildColumn(columnConfig.field, "unselected", -1)
                    : undefined;

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
        fieldName: DashboardColumnType,
        state: DashboardColumnSetting["state"],
        position: number
    ): DashboardColumnSetting {
        return { fieldName, state, position };
    }
}
