import { UserRepository } from "../repositories/UserRepository";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { Future, FutureData } from "../entities/Future";
import { getId } from "../entities/Ref";
import { isPermissionAccessible } from "../entities/Permission";

export class CheckCurrentUserCanAccessSettingsUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(): FutureData<boolean> {
        return Future.joinObj({
            user: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).map(({ user, appSettings }) =>
            isPermissionAccessible({
                userId: user.id,
                userGroupIds: user.userGroups.map(getId),
                permission: appSettings.settingsAccess,
            })
        );
    }
}
