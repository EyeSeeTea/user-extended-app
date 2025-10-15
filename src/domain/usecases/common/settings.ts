import { AppSettings } from "../../entities/AppSettings";
import { FutureData } from "../../entities/Future";
import { User } from "../../entities/User";
import { AppSettingsRepository } from "../../repositories/AppSettingsRepository";

export function getAppSettings(repository: AppSettingsRepository, user: User): FutureData<AppSettings> {
    return repository.get().map(result => {
        return result.validateUserAndBuild(user);
    });
}
