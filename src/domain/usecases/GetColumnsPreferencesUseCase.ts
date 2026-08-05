import { FutureData } from "../entities/Future";
import { Column } from "../entities/UserColumn";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserColumnRepository } from "../repositories/UserColumnRepository";
import { UserProps } from "../entities/UserProps";
import { resolveColumns } from "./common/columns";

export class GetColumnsPreferencesUseCase {
    constructor(
        private userColumnRepository: UserColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<Column[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.userColumnRepository.get().map(userColumnsPreferences => {
                return resolveColumns({
                    columnsConfig: appSettings.columns,
                    preferences: userColumnsPreferences,
                    user: user,
                    buildColumn: (fieldName, state, position) =>
                        Column.build({ fieldName, state, position }).getOrThrow(),
                });
            });
        });
    }
}
