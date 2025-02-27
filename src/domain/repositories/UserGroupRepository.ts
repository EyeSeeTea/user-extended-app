import { FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { Id } from "../entities/Ref";
import { UserGroup } from "../entities/UserGroup";

export interface UserGroupRepository {
    getAll(): FutureData<UserGroup[]>;
    get(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>>;
}

export type GetUsersGroupsOptions = CommonFilterParams & {
    excludeUsersOutsideOrgUnits: boolean;
    usersIds: Id[] | undefined;
};
