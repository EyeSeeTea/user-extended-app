import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserRepository, ListOptions } from "../repositories/UserRepository";

export class ListAllUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(options: ListOptions): FutureData<UserProps[]> {
        return this.userRepository.listAll(options);
    }
}
