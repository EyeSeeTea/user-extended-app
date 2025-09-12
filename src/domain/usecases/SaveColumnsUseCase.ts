import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";

export class SaveColumnsUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    execute(columns: Array<keyof UserProps>): FutureData<void> {
        return this.userRepository.saveColumns(columns);
    }
}
