import { FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { UserRole } from "../entities/UserRole";

export interface UserRoleRepository {
    getAll(): FutureData<UserRole[]>;
    get(options: CommonFilterParams): FutureData<PaginatedResponse<UserRole>>;
}
