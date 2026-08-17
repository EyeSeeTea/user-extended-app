import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserProps } from "../entities/UserProps";
import { DashboardColumnRepository } from "../repositories/DashboardColumnRepository";
import { DashboardColumnSetting } from "../entities/DashboardColumn";
import { resolveColumns } from "./common/columns";

export class GetDashboardColumnsUseCase {
    constructor(
        private dashboardColumnRepository: DashboardColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<DashboardColumnSetting[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.dashboardColumnRepository.get().map(dashboardColumnsPreferences => {
                return resolveColumns({
                    columnsConfig: appSettings.dashboardColumns,
                    preferences: dashboardColumnsPreferences,
                    user: user,
                    buildColumn: (fieldName, state, position) => ({ fieldName, state, position }),
                });
            });
        });
    }
}
