import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { AppSettings, CONSTANT_SETTINGS_CODE } from "../../domain/entities/AppSettings";
import { FutureData } from "../../domain/entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";
import { Permission, PublicPermission } from "../../domain/entities/Permission";
import { apiToFuture } from "../../utils/futures";
import { Maybe } from "../../types/utils";
import { getUid } from "../../utils/uid";

export class AppSettingsD2ConstantRepository implements AppSettingsRepository {
    private constantCode = CONSTANT_SETTINGS_CODE;

    constructor(private api: D2Api) {}

    get(): FutureData<AppSettings> {
        return this.getSettings();
    }

    save(appSettings: AppSettings): FutureData<AppSettings> {
        return apiToFuture(
            this.api.models.constants.get({
                fields: { $owner: true },
                filter: { code: { eq: this.constantCode } },
                paging: false,
            })
        ).flatMap(response => {
            const d2Constant = response.objects[0];
            const name = "User extended app settings storage";
            const constantToSave = {
                ...(d2Constant || {}),
                id: d2Constant?.id ?? getUid("appsettings"),
                code: this.constantCode,
                name,
                shortName: name,
                description: JSON.stringify(appSettings, null, 2),
                value: 1,
            };
            return apiToFuture(this.api.models.constants.post(constantToSave)).map(() => appSettings);
        });
    }

    private getSettings() {
        const emptySettings = AppSettings.emptySettings();

        return this.getConstant().map(d2Response =>
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

    private getConstant(): FutureData<Maybe<AppSettings>> {
        return apiToFuture(
            this.api.models.constants.get({
                fields: { id: true, description: true, code: true, name: true },
                filter: {
                    code: { eq: this.constantCode },
                },
            })
        ).map(response => {
            const d2Constant = response.objects[0];
            if (!d2Constant) return undefined;
            return JSON.parse(d2Constant.description) as AppSettings;
        });
    }
}
