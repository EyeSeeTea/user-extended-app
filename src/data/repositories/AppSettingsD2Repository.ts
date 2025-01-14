import { D2Api } from "../../types/d2-api";
import { AppSettings } from "../../domain/entities/AppSettings";
import { FutureData } from "../../domain/entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Instance } from "../entities/Instance";

export class AppSettingsD2Repository implements AppSettingsRepository {
    private dataStorage: DataStoreStorageClient;
    private settingsKey = "settings";

    constructor(private api: D2Api) {
        this.dataStorage = new DataStoreStorageClient("global", new Instance({ url: this.api.baseUrl }));
    }

    get(): FutureData<AppSettings> {
        return this.getSettings();
    }

    save(appSettings: AppSettings): FutureData<AppSettings> {
        return this.getSettings().flatMap(existingSettings => {
            const updatedSettings = AppSettings.create({
                ...(existingSettings || {}),
                columns: appSettings.columns,
                showOnlyActiveUsers: appSettings.showOnlyActiveUsers,
            });

            return this.dataStorage.saveObject(this.settingsKey, updatedSettings).map(() => updatedSettings);
        });
    }

    private getSettings() {
        return this.dataStorage.getObject<AppSettings>(this.settingsKey).map(d2Response => {
            return d2Response
                ? AppSettings.create({
                      columns: d2Response.columns,
                      showOnlyActiveUsers: d2Response.showOnlyActiveUsers,
                  })
                : AppSettings.emptySettings();
        });
    }
}
