import { FutureData } from "../entities/Future";
import { UserGroup } from "../entities/UserGroup";
import { UserGroupRepository } from "../repositories/UserGroupRepository";

export class GetAllUserGroupsUseCase {
    constructor(private userGroupRepository: UserGroupRepository) {}

    execute(): FutureData<UserGroup[]> {
        return this.userGroupRepository.getAll();
    }
}
