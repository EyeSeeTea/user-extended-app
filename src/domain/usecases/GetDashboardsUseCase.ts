import { Dashboard } from "../entities/Dashboard";
import { FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { DashboardRepository, GetDashboardOptions } from "../repositories/DashboardRepository";
import { getAppSettings } from "./common/settings";

export class GetDashboardsUseCase {
    constructor(
        private dashboardRepository: DashboardRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(options: GetDashboardOptions): FutureData<PaginatedResponse<Dashboard>> {
        return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
            return this.dashboardRepository.get({
                ...options,
                hideUsers: appSettings.hide.users,
                hideGroups: appSettings.hide.userGroups,
            });
        });
    }
}
