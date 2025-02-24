import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { AppSettings } from "../../domain/entities/AppSettings";
import { FutureData } from "../../domain/entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Instance } from "../entities/Instance";
import { Permission, PublicPermission } from "../../domain/entities/Permission";

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
        return this.dataStorage.saveObject(this.settingsKey, appSettings).map(() => appSettings);
    }

    private getSettings() {
        const emptySettings = AppSettings.emptySettings();

        return this.dataStorage.getObject<Partial<AppSettings>>(this.settingsKey).map(d2Response =>
            d2Response
                ? AppSettings.create({
                      ...emptySettings,
                      ...d2Response,
                      settingsAccess: d2Response.settingsAccess
                          ? new Permission(d2Response.settingsAccess)
                          : emptySettings.settingsAccess,
                      actionsAccess: d2Response.actionsAccess
                          ? _.mapValues(d2Response.actionsAccess, p => new PublicPermission(p))
                          : emptySettings.actionsAccess,
                  })
                : emptySettings
        );
    }
}
