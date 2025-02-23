import { UserRepository } from "../repositories/UserRepository";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { Future, FutureData } from "../entities/Future";
import { AppSettings } from "../entities/AppSettings";
import { isSuperAdmin, User } from "../entities/User";
import { getId } from "../entities/Ref";

export class CheckCurrentUserCanAccessSettingsUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(): FutureData<boolean> {
        return Future.joinObj({
            user: this.userRepository.getCurrent(),
            appSettings: this.appSettingsRepository.get(),
        }).map(({ user, appSettings }) => this.checkUserCanAccessSettings(user, appSettings));
    }

    private checkUserCanAccessSettings(user: User, appSettings: AppSettings): boolean {
        if (isSuperAdmin(user)) return true;
        const permissions = appSettings.settingsAccess;
        const publicAccess = permissions.publicAccess.startsWith("r");
        const directAccess = permissions.users.some(u => u.id === user.id);
        const groupAccess = permissions.userGroups.some(({ id: permissionUserGroupId }) =>
            user.userGroups.map(getId).includes(permissionUserGroupId)
        );

        return publicAccess || directAccess || groupAccess;
    }
}
