import { FutureData } from "../entities/Future";
import { UserSimple } from "../entities/UserSimple";
import { UserProps } from "../entities/UserProps";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";
import { toUserSimple } from "./common/userSimple";

/** Lists every user visible to the API, excluding ids in app settings `hide.users` (same idea as {@link GetUsersInOrgUnits}). */
export class GetAllUsersSimpleUseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(user: UserProps): FutureData<UserSimple[]> {
        return getAppSettings(this.appSettingsRepository, user).flatMap(appSettings => {
            return this.userRepository
                .listAllUserIdentifiers({
                    onlyUsersOrgUnits: false,
                    onlyActiveUsers: false,
                    hideUsers: appSettings.hide.users,
                })
                .map(identifiers => identifiers.map(toUserSimple));
        });
    }
}
