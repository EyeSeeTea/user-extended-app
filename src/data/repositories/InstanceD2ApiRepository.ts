import { D2Api } from "../../types/d2-api";
import _ from "lodash";
import { FutureData } from "../../domain/entities/Future";
import { Locale } from "../../domain/entities/Locale";
import { InstanceRepository, LocaleType } from "../../domain/repositories/InstanceRepository";
// eslint-disable-next-line unused-imports/no-unused-imports, @typescript-eslint/no-unused-vars
import { cache } from "../../utils/cache";
import { getD2ApiFromInstance } from "../../utils/d2-api";
import { apiToFuture } from "../../utils/futures";
import { Instance } from "../entities/Instance";

export class InstanceD2ApiRepository implements InstanceRepository {
    private api: D2Api;

    constructor(instance: Instance) {
        this.api = getD2ApiFromInstance(instance);
    }

    public getBaseUrl(): string {
        return this.api.baseUrl;
    }

    @cache()
    public getInstanceVersion(): FutureData<string> {
        return apiToFuture(this.api.system.info).map(({ version }) => version);
    }

    @cache()
    public getLocales(type: LocaleType): FutureData<Locale[]> {
        const path = type === "dbLocale" ? "dbLocales" : "ui";

        return apiToFuture(this.api.get<Partial<Locale>[]>(`/locales/${path}`)).map(items =>
            _.compact(
                items.map(({ name, locale }) =>
                    name !== undefined && locale !== undefined ? { name, locale } : undefined
                )
            )
        );
    }
}
