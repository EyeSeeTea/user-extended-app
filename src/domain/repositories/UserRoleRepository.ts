import { FutureData } from "../entities/Future";
import { UserRole } from "../entities/UserRole";

export interface UserRoleRepository {
    getAll(): FutureData<UserRole[]>;
}
