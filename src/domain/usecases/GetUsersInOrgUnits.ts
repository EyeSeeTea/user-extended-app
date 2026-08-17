import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserSimple } from "../entities/UserSimple";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";
import { toUserSimple } from "./common/userSimple";

/** Lists the users assigned to the current user's org units and below, excluding ids in app
 * settings `hide.users` (same idea as {@link GetAllUsersSimpleUseCase}, which lists every user). */
export class GetUsersInOrgUnits {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    execute(user: UserProps): FutureData<UserSimple[]> {
        return getAppSettings(this.appSettingsRepository, user).flatMap(appSettings => {
            return this.userRepository
                .listAllUserIdentifiers({
                    // userOrgUnits=true + includeChildren=true: my org units *and below*
                    onlyUsersOrgUnits: true,
                    onlyActiveUsers: false,
                    hideUsers: appSettings.hide.users,
                })
                .map(identifiers => identifiers.map(toUserSimple));
        });
    }
}
