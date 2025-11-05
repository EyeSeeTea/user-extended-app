import { Dashboard } from "../entities/Dashboard";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { DashboardRepository } from "../repositories/DashboardRepository";
import { getAppSettings } from "./common/settings";

export class GetDashboardsUseCase {
    constructor(
        private dashboardRepository: DashboardRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(options: UseCaseOptions): FutureData<Dashboard[]> {
        return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
            return this.dashboardRepository.getAll({
                hideUsers: appSettings.hide.users,
                hideGroups: appSettings.hide.userGroups,
            });
        });
    }
}

type UseCaseOptions = {
    user: UserProps;
};
