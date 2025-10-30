import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { UserProps } from "../entities/UserProps";
import { UserRole } from "../entities/UserRole";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository } from "../repositories/UserRepository";
import { UserRoleRepository } from "../repositories/UserRoleRepository";
import { getAppSettings } from "./common/settings";
import { excludeUsers } from "./common/utils";

export class GetUserRolesUseCase {
    constructor(
        private userRoleRepository: UserRoleRepository,
        private appSettingsRepository: AppSettingsRepository,
        private userRepository: UserRepository
    ) {}

    execute(options: GetUsersCommonOptions): FutureData<PaginatedResponse<UserRole>> {
        return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
            if (!options.excludeUsersOutsideOrgUnits) return this.getRoles(options, appSettings);

            return this.getOrgUnitsAndRoles(options, appSettings).map(({ usersInMyOrgUnit, rolesPaginated }) => {
                const usersRolesWithFilteredUsers = excludeUsers(usersInMyOrgUnit, rolesPaginated.objects);
                return { ...rolesPaginated, objects: usersRolesWithFilteredUsers };
            });
        });
    }

    private getOrgUnitsAndRoles(options: CommonFilterParams, appSettings: AppSettings) {
        return Future.joinObj({
            usersInMyOrgUnit: this.userRepository.getInMyOrgUnit(),
            rolesPaginated: this.getRoles(options, appSettings),
        });
    }

    private getRoles(options: CommonFilterParams, appSettings: AppSettings): FutureData<PaginatedResponse<UserRole>> {
        return this.userRoleRepository.get({
            ...options,
            hideRoles: appSettings.hide.userRoles,
            hideUsers: appSettings.hide.users,
        });
    }
}

export type GetUsersCommonOptions = CommonFilterParams & { excludeUsersOutsideOrgUnits: boolean; user: UserProps };
