import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";

export class GetUsersByIdsUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(ids: string[]): FutureData<UserProps[]> {
        return this.userRepository.getByIds(ids);
    }
}
