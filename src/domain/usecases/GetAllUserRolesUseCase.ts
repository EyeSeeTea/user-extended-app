import { FutureData } from "../entities/Future";
import { UserRole } from "../entities/UserRole";
import { UserRoleRepository } from "../repositories/UserRoleRepository";

export class GetAllUserRolesUseCase {
    constructor(private userRoleRepository: UserRoleRepository) {}

    execute(): FutureData<UserRole[]> {
        return this.userRoleRepository.getAll();
    }
}
