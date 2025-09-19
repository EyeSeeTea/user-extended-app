import { Future, FutureData } from "../entities/Future";
import { Stats } from "../entities/Stats";
import { allUsersHaveEmail, User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import i18n from "../../utils/i18n";

export class ResetUsersPasswordsUseCase {
    constructor(private userRepository: UserRepository) {}

    execute(users: User[]): FutureData<Stats> {
        const allUsersCanBeUpdated = allUsersHaveEmail(users);

        if (allUsersCanBeUpdated) {
            return this.userRepository.resetPasswords(users);
        } else {
            return Future.error(i18n.t("Not all users have emails"));
        }
    }
}
