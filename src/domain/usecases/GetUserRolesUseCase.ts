import { Maybe } from "../../types/utils";
import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { Id } from "../entities/Ref";
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

            return this.getUsersAndRoles(options, appSettings).map(({ usersInMyOrgUnit, rolesPaginated }) => {
                const usersRolesWithFilteredUsers = excludeUsers(usersInMyOrgUnit, rolesPaginated.objects);
                return { ...rolesPaginated, objects: usersRolesWithFilteredUsers };
            });
        });
    }

    private getUsersAndRoles(options: GetUsersCommonOptions, appSettings: AppSettings) {
        return Future.joinObj({
            usersInMyOrgUnit: this.userRepository.getInMyOrgUnit(),
            rolesPaginated: this.getRoles(options, appSettings),
        });
    }

    private getRoles(
        options: GetUsersCommonOptions,
        appSettings: AppSettings
    ): FutureData<PaginatedResponse<UserRole>> {
        return this.userRoleRepository.get({
            ...options,
            hideRoles: appSettings.hide.userRoles,
            hideUsers: appSettings.hide.users,
            userIds: options.userIds,
        });
    }
}

export type GetUsersCommonOptions = CommonFilterParams & {
    excludeUsersOutsideOrgUnits: boolean;
    user: UserProps;
    userIds: Maybe<Id[]>;
};
