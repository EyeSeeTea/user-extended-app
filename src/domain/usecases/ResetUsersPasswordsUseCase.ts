import { FutureData } from "../entities/Future";
import { Stats } from "../entities/Stats";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class ResetUsersPasswordsUseCase {
    constructor(private userRepository: UserRepository) {}

    execute(users: User[]): FutureData<Stats> {
        return this.userRepository.resetPasswords(users);
    }
}
