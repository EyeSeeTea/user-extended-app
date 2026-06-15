import { UserRepository } from "../repositories/UserRepository";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { Future, FutureData } from "../entities/Future";
import { getId } from "../entities/Ref";
import { isSuperAdmin } from "../entities/UserProps";

export class CheckCurrentUserCanAccessImportSettingsUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(): FutureData<boolean> {
        return Future.joinObj({
            user: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).map(({ user, appSettings }) => {
            const access = {
                userId: getId(user),
                userGroupIds: user.userGroups.map(getId),
            };

            return (
                isSuperAdmin(user) ||
                appSettings.settingsAccess.isAccessible(access) ||
                appSettings.importSettingsAccess.isAccessible(access)
            );
        });
    }
}
