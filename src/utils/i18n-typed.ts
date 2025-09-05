import i18n from "../locales";

export function getModuleForNamespace(namespace: string): i18n.i18n {
    const { t: _t, changeLanguage, ...rest } = i18n;

    const restBinded = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => [key, typeof value === "function" ? value.bind(i18n) : value])
    ) as typeof rest;

    return {
        ...restBinded,
        t: function (s: string | string[], options?: i18n.TranslationOptions<object>): string {
            return i18n.t(s, { ...options, ns: namespace });
        },
        changeLanguage: changeLanguage.bind(i18n),
    };
}
