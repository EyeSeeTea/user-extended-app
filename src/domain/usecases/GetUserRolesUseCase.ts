import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
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

    execute(options: { user: UserProps; excludeUsersOutsideOrgUnits: boolean }): FutureData<UserRole[]> {
        return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
            if (!options.excludeUsersOutsideOrgUnits) return this.getRoles(appSettings);

            return this.getUsersAndRoles(appSettings).map(({ usersInMyOrgUnit, roles }) => {
                const usersRolesWithFilteredUsers = excludeUsers(usersInMyOrgUnit, roles);
                return usersRolesWithFilteredUsers;
            });
        });
    }

    private getUsersAndRoles(appSettings: AppSettings) {
        return Future.joinObj({
            usersInMyOrgUnit: this.userRepository.getInMyOrgUnit(),
            roles: this.getRoles(appSettings),
        });
    }

    private getRoles(appSettings: AppSettings): FutureData<UserRole[]> {
        return this.userRoleRepository.getAllBy({
            hideRoles: appSettings.hide.userRoles,
            hideUsers: appSettings.hide.users,
        });
    }
}
