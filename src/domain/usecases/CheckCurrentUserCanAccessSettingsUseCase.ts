import { UserRepository } from "../repositories/UserRepository";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { Future, FutureData } from "../entities/Future";
import { isSuperAdmin } from "../entities/User";
import { getId } from "../entities/Ref";

export class CheckCurrentUserCanAccessSettingsUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(): FutureData<boolean> {
        return Future.joinObj({
            user: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).map(
            ({ user, appSettings }) =>
                isSuperAdmin(user) ||
                appSettings.settingsAccess.isAccessible({
                    userId: getId(user),
                    userGroupIds: user.userGroups.map(getId),
                })
        );
    }
}
