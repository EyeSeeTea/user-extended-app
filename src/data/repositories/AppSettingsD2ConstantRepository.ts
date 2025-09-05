import { D2Api } from "../../types/d2-api";
import { AppSettings, CONSTANT_SETTINGS_CODE } from "../../domain/entities/AppSettings";
import { FutureData } from "../../domain/entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";
import { apiToFuture } from "../../utils/futures";
import { Maybe } from "../../types/utils";
import { getUid } from "../../utils/uid";
import { mergeAndAddRuntimeProps, removeRuntimeLogic } from "./common/appSettingsHelpers";

export class AppSettingsD2ConstantRepository implements AppSettingsRepository {
    private constantCode = CONSTANT_SETTINGS_CODE;

    constructor(private api: D2Api) {}

    get(): FutureData<AppSettings> {
        return this.getSettings();
    }

    save(appSettings: AppSettings): FutureData<AppSettings> {
        const settingsToSave = removeRuntimeLogic(appSettings);

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
                description: JSON.stringify(settingsToSave, null, 2),
                value: 1,
            };
            return apiToFuture(this.api.metadata.post({ constants: [constantToSave] })).map(() => appSettings);
        });
    }

    private getSettings() {
        return this.getConstant().map(d2Response => mergeAndAddRuntimeProps(d2Response));
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
            return JSON.parse(d2Constant.description) as AppSettings; //TODO: Type checking with Codec
        });
    }
}
