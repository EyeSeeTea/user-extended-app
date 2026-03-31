import { isBoolean } from "lodash/fp";
import type { TOptions } from "i18next";
import i18n from "../locales";

export function getModuleForNamespace(namespace: string) {
    const { t: _t, changeLanguage, ...rest } = i18n;

    const restBinded = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => [key, typeof value === "function" ? value.bind(i18n) : value])
    ) as typeof rest;

    return {
        ...restBinded,
        t: function (s: string | string[], options?: i18nOptions): string {
            const nsSeparator: string | undefined = isBoolean(options?.nsSeparator) ? undefined : options?.nsSeparator;
            return i18n.t(s, { ...options, ns: namespace, nsSeparator });
        },
        changeLanguage: changeLanguage.bind(i18n),
    };
}

interface i18nOptions extends Omit<TOptions, "nsSeparator"> {
    nsSeparator?: boolean | string;
}
