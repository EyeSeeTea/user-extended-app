import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserIdentifier } from "../entities/UserIdentifier";
import { ListOptions, UserRepository } from "../repositories/UserRepository";

export class ListAllUserIdentifiersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(options: ListOptions): FutureData<UserIdentifier[]> {
        return this.userRepository.listAllUserIdentifiers(options);
    }
}
