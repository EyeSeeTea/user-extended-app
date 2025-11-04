import { Maybe } from "../../types/utils";
import { FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { Id } from "../entities/Ref";
import { UserRole } from "../entities/UserRole";

export interface UserRoleRepository {
    getAll(): FutureData<UserRole[]>;
    get(options: GetUserRolesParams): FutureData<PaginatedResponse<UserRole>>;
}

export type GetUserRolesParams = CommonFilterParams & {
    hideRoles: Maybe<Id[]>;
    hideUsers: Maybe<Id[]>;
    userIds: Maybe<Id[]>;
};
