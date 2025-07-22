import { FutureData } from "../entities/Future";
import { Stats } from "../entities/Stats";
import { UserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";

export class RemoveUsersUseCase {
    constructor(private userRepository: UserRepository) {}

    execute(users: UserProps[]): FutureData<Stats> {
        return this.userRepository.remove(users);
    }
}
