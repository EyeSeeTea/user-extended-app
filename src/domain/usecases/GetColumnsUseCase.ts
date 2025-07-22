import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";

export class GetColumnsUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    execute(): FutureData<Array<keyof UserProps>> {
        return this.userRepository.getColumns();
    }
}
