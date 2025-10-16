import { FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { UserSimple } from "../entities/UserSimple";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { OrgUnitRepository } from "../repositories/OrgUnitRepository";
import { UserSimpleRepository } from "../repositories/UserSimpleRepository";
import { getAppSettings } from "./common/settings";

export class GetUsersInOrgUnits {
    constructor(
        private orgUnitRepository: OrgUnitRepository,
        private userRepository: UserSimpleRepository,
        private appSettings: AppSettingsRepository
    ) {}

    execute(user: User): FutureData<UserSimple[]> {
        return getAppSettings(this.appSettings, user).flatMap(appSettings => {
            return this.orgUnitRepository.getWithUsers().flatMap(orgUnits => {
                const usersIds = orgUnits.flatMap(orgUnit => orgUnit.users ?? []);
                const excludeUsers =
                    appSettings.hide.users.length > 0
                        ? usersIds.filter(userId => appSettings.hide.users.includes(userId) === false)
                        : usersIds;
                return this.userRepository.getByIds(excludeUsers);
            });
        });
    }
}
