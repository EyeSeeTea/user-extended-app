import { D2Api } from "@eyeseetea/d2-api/2.36";
import _ from "lodash";
import { Future, FutureData } from "../../domain/entities/Future";
import { Locale } from "../../domain/entities/Locale";
import { InstanceRepository, LocaleType } from "../../domain/repositories/InstanceRepository";
import { cache } from "../../utils/cache";
import { getD2APiFromInstance } from "../../utils/d2-api";
import { apiToFuture } from "../../utils/futures";
import { Instance } from "../entities/Instance";
import { boolean, Codec } from "purify-ts";
import i18n from "../../locales";

export class InstanceD2ApiRepository implements InstanceRepository {
    private api: D2Api;

    constructor(instance: Instance) {
        this.api = getD2APiFromInstance(instance);
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

    verifyPassword(password: string): FutureData<boolean> {
        return apiToFuture(
            this.api.post<typeof verifyPasswordResponseCodec>("/verifyPassword", undefined, { password: password })
        ).flatMap(data => {
            return verifyPasswordResponseCodec.decode(data).caseOf<FutureData<boolean>>({
                Left: () => Future.error(i18n.t("Invalid response from server")),
                Right: data => Future.success(data.isCorrectPassword),
            });
        });
    }
}

const verifyPasswordResponseCodec = Codec.interface({
    isCorrectPassword: boolean,
});
