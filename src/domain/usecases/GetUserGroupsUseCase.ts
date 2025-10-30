import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { UserGroup } from "../entities/UserGroup";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { GetUsersGroupsOptions, UserGroupRepository } from "../repositories/UserGroupRepository";
import { UserRepository } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";
import { excludeUsers } from "./common/utils";

export class GetUserGroupsUseCase {
    constructor(
        private userGroupRepository: UserGroupRepository,
        private appSettingsRepository: AppSettingsRepository,
        private userRepository: UserRepository
    ) {}

    execute(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>> {
        return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
            if (!options.excludeUsersOutsideOrgUnits) return this.getGroups(options, appSettings);

            return this.getOrgUnitsAndGroups(options, appSettings).map(({ usersInMyOrgUnit, groupsPaginated }) => {
                const groupsWithOutUsers = excludeUsers<UserGroup>(usersInMyOrgUnit, groupsPaginated.objects);
                return { ...groupsPaginated, objects: groupsWithOutUsers };
            });
        });
    }

    private getOrgUnitsAndGroups(options: GetUsersGroupsOptions, appSettings: AppSettings) {
        return Future.joinObj({
            usersInMyOrgUnit: this.userRepository.getInMyOrgUnit(),
            groupsPaginated: this.getGroups(options, appSettings),
        });
    }

    private getGroups(
        options: GetUsersGroupsOptions,
        appSettings: AppSettings
    ): FutureData<PaginatedResponse<UserGroup>> {
        return this.userGroupRepository.get({
            ...options,
            hideUsers: appSettings.hide.users,
            hideGroups: appSettings.hide.userGroups,
        });
    }
}
