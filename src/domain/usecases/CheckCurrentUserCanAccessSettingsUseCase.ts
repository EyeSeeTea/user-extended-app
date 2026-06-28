import { UserRepository } from "../repositories/UserRepository";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { Future, FutureData } from "../entities/Future";
import { getId } from "../entities/Ref";
import { isSuperAdmin } from "../entities/UserProps";

type UserSettingsAccess = {
    accessToSettings: boolean;
    accessToImport: boolean;
};

export class CheckCurrentUserCanAccessSettingsUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(): FutureData<UserSettingsAccess> {
        return Future.joinObj({
            user: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).map(({ user, appSettings }) => {
            const access = {
                userId: getId(user),
                userGroupIds: user.userGroups.map(getId),
            };

            const accessToSettings = isSuperAdmin(user) || appSettings.settingsAccess.isAccessible(access);
            const accessToImport = accessToSettings || appSettings.importSettingsAccess.isAccessible(access);

            return { accessToSettings, accessToImport };
        });
    }
}
