import { MetadataResponse } from "../../types/d2-api";
import i18n from "../../utils/i18n";
import { Future, FutureData } from "../entities/Future";
import { canRunPasswordActionOnUsers } from "../entities/PasswordActionAccess";
import { User } from "../entities/User";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository } from "../repositories/UserRepository";

export class SetUserPasswordUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    public execute(userToSave: User): FutureData<MetadataResponse> {
        return Future.joinObj({
            currentUser: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).flatMap(({ currentUser, appSettings }) => {
            const isAllowed = canRunPasswordActionOnUsers({
                currentUser,
                users: [userToSave],
                isLimitedToOrgUnits: appSettings.limitPasswordActionsToUserOrgUnits,
            });

            if (!isAllowed) {
                return Future.error(
                    i18n.t("You are not allowed to set the password of users outside your organisation units")
                );
            }

            return this.userRepository
                .verifyPassword(userToSave.password)
                .flatMap(() => this.userRepository.save([userToSave]));
        });
    }
}
