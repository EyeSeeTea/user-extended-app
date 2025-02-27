import { Future, FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { UserRole } from "../entities/UserRole";
import { OrgUnitRepository } from "../repositories/OrgUnitRepository";
import { UserRoleRepository } from "../repositories/UserRoleRepository";
import { excludeUsers } from "./common/utils";

export class GetUserRolesUseCase {
    constructor(private userRoleRepository: UserRoleRepository, private orgUnitRepository: OrgUnitRepository) {}

    execute(options: GetUsersCommonOptions): FutureData<PaginatedResponse<UserRole>> {
        if (!options.excludeUsersOutsideOrgUnits) return this.getRoles(options);

        return this.getOrgUnitsAndRoles(options).map(({ orgUnits, rolesPaginated }) => {
            const usersRolesWithFilteredUsers = excludeUsers(orgUnits, rolesPaginated.objects);
            return { ...rolesPaginated, objects: usersRolesWithFilteredUsers };
        });
    }

    private getOrgUnitsAndRoles(options: CommonFilterParams) {
        return Future.joinObj({
            orgUnits: this.orgUnitRepository.getWithUsers(),
            rolesPaginated: this.getRoles(options),
        });
    }

    private getRoles(options: CommonFilterParams): FutureData<PaginatedResponse<UserRole>> {
        return this.userRoleRepository.get(options);
    }
}

export type GetUsersCommonOptions = CommonFilterParams & { excludeUsersOutsideOrgUnits: boolean };
