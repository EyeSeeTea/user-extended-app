import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";

export class GetCurrentUserUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(): FutureData<UserProps> {
        return this.userRepository.getCurrent();
    }
}
