import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserProps } from "../entities/UserProps";
import { RoleColumnRepository } from "../repositories/RoleColumnRepository";
import { RoleColumnSetting } from "../entities/RoleColumn";
import { resolveColumns } from "./common/columns";

export class GetRoleColumnsUseCase {
    constructor(
        private roleColumnRepository: RoleColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<RoleColumnSetting[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.roleColumnRepository.get().map(roleColumnsPreferences => {
                return resolveColumns({
                    columnsConfig: appSettings.roleColumns,
                    preferences: roleColumnsPreferences,
                    user: user,
                    buildColumn: (fieldName, state, position) => ({ fieldName, state, position }),
                });
            });
        });
    }
}
