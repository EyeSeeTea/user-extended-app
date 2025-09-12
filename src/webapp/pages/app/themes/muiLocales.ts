import * as locales from "@material-ui/core/locale";
import { Localization } from "@material-ui/core/locale";
import { Maybe } from "../../../../types/utils";

// Reference: https://v4.mui.com/guides/localization/

export type MuiSupportedLocales = keyof typeof locales;

// There is one 'duplication' in the list below, Portuguese (Brazil) and Portuguese (Portugal) are both listed.
// CSV was done manually just copy-pasting and changing tabs by semicolons.
// Later transformed to JSON for easier handling.
const muiLocales = [
    { name: "Armenian", bcp47: "hy-AM", importName: "hyAM" },
    { name: "Azerbaijani", bcp47: "az-AZ", importName: "azAZ" },
    { name: "Bulgarian", bcp47: "bg-BG", importName: "bgBG" },
    { name: "Catalan", bcp47: "ca-ES", importName: "caES" },
    { name: "Chinese (Simplified)", bcp47: "zh-CN", importName: "zhCN" },
    { name: "Czech", bcp47: "cs-CZ", importName: "csCZ" },
    { name: "Dutch", bcp47: "nl-NL", importName: "nlNL" },
    { name: "English (United States)", bcp47: "en-US", importName: "enUS" },
    { name: "Estonian", bcp47: "et-EE", importName: "etEE" },
    { name: "Finnish", bcp47: "fi-FI", importName: "fiFI" },
    { name: "French", bcp47: "fr-FR", importName: "frFR" },
    { name: "German", bcp47: "de-DE", importName: "deDE" },
    { name: "Hebrew", bcp47: "he-IL", importName: "heIL" },
    { name: "Hindi", bcp47: "hi-IN", importName: "hiIN" },
    { name: "Hungarian", bcp47: "hu-HU", importName: "huHU" },
    { name: "Icelandic", bcp47: "is-IS", importName: "isIS" },
    { name: "Indonesian", bcp47: "id-ID", importName: "idID" },
    { name: "Italian", bcp47: "it-IT", importName: "itIT" },
    { name: "Japanese", bcp47: "ja-JP", importName: "jaJP" },
    { name: "Korean", bcp47: "ko-KR", importName: "koKR" },
    { name: "Persian", bcp47: "fa-IR", importName: "faIR" },
    { name: "Polish", bcp47: "pl-PL", importName: "plPL" },
    { name: "Portuguese (Brazil)", bcp47: "pt-BR", importName: "ptBR" },
    { name: "Portuguese", bcp47: "pt-PT", importName: "ptPT" },
    { name: "Romanian", bcp47: "ro-RO", importName: "roRO" },
    { name: "Russian", bcp47: "ru-RU", importName: "ruRU" },
    { name: "Slovak", bcp47: "sk-SK", importName: "skSK" },
    { name: "Spanish", bcp47: "es-ES", importName: "esES" },
    { name: "Swedish", bcp47: "sv-SE", importName: "svSE" },
    { name: "Turkish", bcp47: "tr-TR", importName: "trTR" },
    { name: "Ukrainian", bcp47: "uk-UA", importName: "ukUA" },
    { name: "Vietnamese", bcp47: "vi-VN", importName: "viVN" },
] as const;

const muiLocalizations = muiLocales.map(localeObj => {
    const { name, bcp47, importName } = localeObj;
    const localeParts = (bcp47 ?? "").split("-");
    const locale = localeParts[0];
    const country = localeParts[1] ?? localeParts[0]?.toUpperCase();
    const localization: Localization = locales[importName];

    return { name, bcp47, importName, locale, localization, country };
});

export function getMuiLocalization(language: string, country: Maybe<string>): Localization {
    const locale = muiLocalizations.find(l => l.locale === language && l.country === country);
    // Edge case: only locale codes listed in muiLocalesCSV (e.g., 'vi-VN' for Vietnamese) are supported; others (e.g., 'vi-VI') will not be found
    const locale2nd = muiLocalizations.find(l => l.locale === language);

    if (!locale && !locale2nd) {
        console.warn(`Localization for language "${language}" not found, falling back to "en-US".`);
        console.debug("Available localizations:", muiLocalizations);
        console.debug("Requested language:", language, "country:", country);
        console.debug("Locale:", locale, "Locale2nd:", locale2nd);
    }

    return locale?.localization || locale2nd?.localization || locales.enUS;
}
