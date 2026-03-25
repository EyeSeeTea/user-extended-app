import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserSearch } from "../entities/UserSearch";
import { UserSearchRepository } from "../repositories/UserSearchRepository";

export class SearchUsersAndUserGroupsUseCase implements UseCase {
    constructor(private userSearchRepository: UserSearchRepository) {}

    public execute(name: string): FutureData<UserSearch> {
        return this.userSearchRepository.search(name);
    }
}
