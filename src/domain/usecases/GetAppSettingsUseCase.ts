import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";
import { User } from "../entities/User";
import { getAppSettings } from "./common/settings";

export class GetAppSettingsUseCase {
    constructor(private appSettingsRepository: AppSettingsRepository) {}

    execute(user: User): FutureData<AppSettings> {
        return getAppSettings(this.appSettingsRepository, user).map(result => {
            return result.validateUserAndBuild(user);
        });
    }
}
