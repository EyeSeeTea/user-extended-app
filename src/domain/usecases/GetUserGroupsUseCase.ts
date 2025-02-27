import { Future, FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { UserGroup } from "../entities/UserGroup";
import { OrgUnitRepository } from "../repositories/OrgUnitRepository";
import { GetUsersGroupsOptions, UserGroupRepository } from "../repositories/UserGroupRepository";
import { excludeUsers } from "./common/utils";

export class GetUserGroupsUseCase {
    constructor(private userGroupRepository: UserGroupRepository, private orgUnitRepository: OrgUnitRepository) {}

    execute(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>> {
        if (!options.excludeUsersOutsideOrgUnits) return this.getGroups(options);

        return this.getOrgUnitsAndGroups(options).map(({ orgUnits, groupsPaginated }) => {
            const groupsWithOutUsers = excludeUsers<UserGroup>(orgUnits, groupsPaginated.objects);
            return { ...groupsPaginated, objects: groupsWithOutUsers };
        });
    }

    private getOrgUnitsAndGroups(options: GetUsersGroupsOptions) {
        return Future.joinObj({
            orgUnits: this.orgUnitRepository.getWithUsers(),
            groupsPaginated: this.getGroups(options),
        });
    }

    private getGroups(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>> {
        return this.userGroupRepository.get(options);
    }
}
