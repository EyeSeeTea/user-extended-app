import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";

export class GetAppSettingsUseCase {
    constructor(private appSettingsRepository: AppSettingsRepository) {}

    execute(): FutureData<AppSettings> {
        return this.appSettingsRepository.get();
    }
}
