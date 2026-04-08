import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";

export interface AppSettingsRepository {
    get(): FutureData<AppSettings>;
    save(appSettings: AppSettings): FutureData<AppSettings>;
}
