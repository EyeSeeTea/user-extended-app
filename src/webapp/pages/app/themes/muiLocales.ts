import * as locales from "@material-ui/core/locale";
import { Localization } from "@material-ui/core/locale";
import { Maybe } from "../../../../types/utils";

// Reference: https://v4.mui.com/guides/localization/

export type MuiSupportedLocales = keyof typeof locales;

// There is one 'duplication' in the list below, Portuguese (Brazil) and Portuguese (Portugal) are both listed.
// CSV was done manually just copy-pasting and changing tabs by semicolons.
const muiLocalesCSV = [
    "Armenian;hy-AM;hyAM",
    "Azerbaijani;az-AZ;azAZ",
    "Bulgarian;bg-BG;bgBG",
    "Catalan;ca-ES;caES",
    "Chinese (Simplified);zh-CN;zhCN",
    "Czech;cs-CZ;csCZ",
    "Dutch;nl-NL;nlNL",
    "English (United States);en-US;enUS",
    "Estonian;et-EE;etEE",
    "Finnish;fi-FI;fiFI",
    "French;fr-FR;frFR",
    "German;de-DE;deDE",
    "Hebrew;he-IL;heIL",
    "Hindi;hi-IN;hiIN",
    "Hungarian;hu-HU;huHU",
    "Icelandic;is-IS;isIS",
    "Indonesian;id-ID;idID",
    "Italian;it-IT;itIT",
    "Japanese;ja-JP;jaJP",
    "Korean;ko-KR;koKR",
    "Persian;fa-IR;faIR",
    "Polish;pl-PL;plPL",
    "Portuguese (Brazil);pt-BR;ptBR",
    "Portuguese;pt-PT;ptPT",
    "Romanian;ro-RO;roRO",
    "Russian;ru-RU;ruRU",
    "Slovak;sk-SK;skSK",
    "Spanish;es-ES;esES",
    "Swedish;sv-SE;svSE",
    "Turkish;tr-TR;trTR",
    "Ukrainian;uk-UA;ukUA",
    "Vietnamese;vi-VN;viVN",
];

const muiLocalizations = muiLocalesCSV.map(str => {
    const [name, bcp47, importName] = str.split(";");
    const localeParts = (bcp47 ?? "").split("-");
    const locale = localeParts[0];
    const country = localeParts[1];

    if (!isValidImportName(importName)) {
        throw new Error(`Invalid locale importName: ${importName}`);
    }

    const localization: Localization = locales[importName];

    return { name, bcp47, importName, locale, localization, country };
});

function isValidImportName(importName: Maybe<string>): importName is MuiSupportedLocales {
    if (!importName) return false;
    return Object.keys(locales).includes(importName);
}

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
