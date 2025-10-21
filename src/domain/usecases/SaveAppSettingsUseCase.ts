import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";

export class SaveAppSettingsUseCase {
    constructor(private appSettingsRepository: AppSettingsRepository) {}

    execute(options: SaveAppSettingsOptions): FutureData<AppSettings> {
        const settingsWithStatus = options.appSettings.updateStatus("active");
        return this.appSettingsRepository.save(settingsWithStatus);
    }
}

export type SaveAppSettingsOptions = { appSettings: AppSettings };
