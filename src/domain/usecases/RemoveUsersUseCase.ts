import { FutureData } from "../entities/Future";
import { Id } from "../entities/Ref";
import { Stats } from "../entities/Stats";
import { UserRepository } from "../repositories/UserRepository";

export class RemoveUsersUseCase {
    constructor(private userRepository: UserRepository) {}

    execute(ids: Id[]): FutureData<Stats> {
        return this.userRepository.remove(ids);
    }
}
