import { FutureData } from "../entities/Future";
import { NamedRef } from "../entities/Ref";
import { UserGroupDescriptionSourceRepository } from "../repositories/UserGroupDescriptionSourceRepository";

export class GetUserGroupDescriptionSourcesUseCase {
    constructor(private userGroupDescriptionSourceRepository: UserGroupDescriptionSourceRepository) {}

    execute(): FutureData<NamedRef[]> {
        return this.userGroupDescriptionSourceRepository.get();
    }
}
