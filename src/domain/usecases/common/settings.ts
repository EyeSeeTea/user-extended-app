import { AppSettings } from "../../entities/AppSettings";
import { FutureData } from "../../entities/Future";
import { UserProps } from "../../entities/UserProps";
import { AppSettingsRepository } from "../../repositories/AppSettingsRepository";

export function getAppSettings(repository: AppSettingsRepository, user: UserProps): FutureData<AppSettings> {
    return repository.get().map(result => {
        return result.validateUserAndBuild(user);
    });
}
