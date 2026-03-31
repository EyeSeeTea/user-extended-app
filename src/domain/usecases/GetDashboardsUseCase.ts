import { Dashboard } from "../entities/Dashboard";
import { Future, FutureData } from "../entities/Future";
import { UserIdentifier } from "../entities/UserIdentifier";
import { UserProps } from "../entities/UserProps";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { DashboardRepository } from "../repositories/DashboardRepository";
import { UserRepository } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";

export class GetDashboardsUseCase {
    constructor(
        private dashboardRepository: DashboardRepository,
        private appSettingsRepository: AppSettingsRepository,
        private userRepository: UserRepository
    ) {}

    execute(options: UseCaseOptions): FutureData<Dashboard[]> {
        return this.getUsersInOrgUnit(options.excludeUsersOutsideOrgUnits).flatMap(usersInMyOrgUnit => {
            return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
                return this.dashboardRepository
                    .getAll({
                        hideUsers: appSettings.hide.users,
                        hideGroups: appSettings.hide.userGroups,
                    })
                    .map(dashboards => {
                        if (!options.excludeUsersOutsideOrgUnits) return dashboards;

                        const usersInOrgUnitIds = new Set(usersInMyOrgUnit.map(user => user.id));
                        return dashboards.map(dashboard => {
                            return Dashboard.create({
                                ...dashboard,
                                users: dashboard.users.filter(user => usersInOrgUnitIds.has(user.id)),
                            });
                        });
                    });
            });
        });
    }

    private getUsersInOrgUnit(excludeUsersOutsideOrgUnits: boolean): FutureData<UserIdentifier[]> {
        if (!excludeUsersOutsideOrgUnits) return Future.success([]);
        return this.userRepository.getInMyOrgUnit();
    }
}

type UseCaseOptions = {
    user: UserProps;
    excludeUsersOutsideOrgUnits: boolean;
};
