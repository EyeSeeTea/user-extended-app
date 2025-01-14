import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";

export class SaveAppSettingsUseCase {
    constructor(private appSettingsRepository: AppSettingsRepository) {}

    execute(options: SaveAppSettingsOptions): FutureData<AppSettings> {
        return this.appSettingsRepository.save(options.appSettings);
    }
}

export type SaveAppSettingsOptions = { appSettings: AppSettings };
