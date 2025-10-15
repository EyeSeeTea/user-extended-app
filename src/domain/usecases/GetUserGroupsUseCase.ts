import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { UserGroup } from "../entities/UserGroup";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { OrgUnitRepository } from "../repositories/OrgUnitRepository";
import { GetUsersGroupsOptions, UserGroupRepository } from "../repositories/UserGroupRepository";
import { getAppSettings } from "./common/settings";
import { excludeUsers } from "./common/utils";

export class GetUserGroupsUseCase {
    constructor(
        private userGroupRepository: UserGroupRepository,
        private orgUnitRepository: OrgUnitRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>> {
        return getAppSettings(this.appSettingsRepository, options.user).flatMap(appSettings => {
            if (!options.excludeUsersOutsideOrgUnits) return this.getGroups(options, appSettings);

            return this.getOrgUnitsAndGroups(options, appSettings).map(({ orgUnits, groupsPaginated }) => {
                const groupsWithOutUsers = excludeUsers<UserGroup>(orgUnits, groupsPaginated.objects);
                return { ...groupsPaginated, objects: groupsWithOutUsers };
            });
        });
    }

    private getOrgUnitsAndGroups(options: GetUsersGroupsOptions, appSettings: AppSettings) {
        return Future.joinObj({
            orgUnits: this.orgUnitRepository.getWithUsers(),
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
