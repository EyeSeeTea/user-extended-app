import { Future, FutureData } from "../entities/Future";
import { Stats } from "../entities/Stats";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import i18n from "../../utils/i18n";
import { allUsersHaveEmail } from "../entities/UserProps";
import { canRunPasswordActionOnUsers } from "../entities/PasswordActionAccess";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";

export class ResetUsersPasswordsUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(users: User[]): FutureData<Stats> {
        return Future.joinObj({
            currentUser: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).flatMap(({ currentUser, appSettings }) => {
            const isAllowed = canRunPasswordActionOnUsers({
                currentUser,
                users,
                isLimitedToOrgUnits: appSettings.limitPasswordActionsToUserOrgUnits,
            });

            if (!isAllowed) {
                return Future.error(
                    i18n.t("You are not allowed to reset the password of users outside your organisation units")
                );
            }

            const allUsersCanBeUpdated = allUsersHaveEmail(users);

            if (allUsersCanBeUpdated) {
                return this.userRepository.resetPasswords(users);
            } else {
                return Future.error(i18n.t("Not all users have emails"));
            }
        });
    }
}
