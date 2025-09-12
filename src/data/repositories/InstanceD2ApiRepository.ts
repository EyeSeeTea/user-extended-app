import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Codec, exactly, string } from "purify-ts";
import { Future, FutureData } from "../../domain/entities/Future";
import { Locale } from "../../domain/entities/Locale";
import { InstanceRepository, LocaleType } from "../../domain/repositories/InstanceRepository";
import { cache } from "../../utils/cache";
import { getD2APiFromInstance } from "../../utils/d2-api";
import { apiToFuture } from "../../utils/futures";
import { Instance } from "../entities/Instance";
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

    verifyPassword(password: string): FutureData<true> {
        return apiToFuture(
            this.api.post<typeof verifyPasswordResponseCodec>(`/account/validatePassword?password=${password}`)
        ).flatMap(data => {
            return verifyPasswordResponseCodec.decode(data).caseOf<FutureData<true>>({
                Left: () => Future.error(i18n.t("Invalid response from server")),
                Right: data => {
                    if (data.response === "error") {
                        return Future.error(data.message || i18n.t("Unknown error"));
                    } else {
                        return Future.success(true);
                    }
                },
            });
        });
    }
}

const verifyPasswordResponseCodec = Codec.interface({
    response: exactly("success", "error"),
    message: string,
});
