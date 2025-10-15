import { Maybe } from "../../types/utils";
import { FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { Id } from "../entities/Ref";
import { User } from "../entities/User";
import { UserGroup } from "../entities/UserGroup";

export interface UserGroupRepository {
    getAll(): FutureData<UserGroup[]>;
    get(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>>;
}

export type GetUsersGroupsOptions = CommonFilterParams & {
    excludeUsersOutsideOrgUnits: boolean;
    usersIds: Maybe<Id[]>;
    hideUsers: Maybe<Id[]>;
    hideGroups: Maybe<Id[]>;
    user: User;
};
