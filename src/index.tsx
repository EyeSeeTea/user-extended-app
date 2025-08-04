// import d2UiComponentsI18n from "@eyeseetea/d2-ui-components/locales";
// import d2I18n from "@dhis2/d2-i18n";
import { Provider } from "@dhis2/app-runtime";
import axios from "axios";
import { init } from "d2/lib/d2";
import _ from "lodash";
import ReactDOM from "react-dom";
import { Instance } from "./data/entities/Instance";
import { D2Api } from "./types/d2-api";
import { getD2APiFromInstance } from "./utils/d2-api";
import { App } from "./webapp/pages/app/App";
import userExtendedI18n from "./locales";
import { LegacyD2I18n } from "./types/d2-legacy-i18n";
import "./webapp/utils/wdyr";

declare global {
    interface Window {
        api: D2Api;
        d2: any;
    }
}

const isDev = process.env.NODE_ENV === "development";

async function getBaseUrl() {
    if (isDev) {
        return "/dhis2"; // See src/setupProxy.js
    } else {
        const { data: manifest } = await axios.get("manifest.webapp");
        return manifest.activities.dhis.href;
    }
}

const isLangRTL = (code: string) => {
    const langs = ["ar", "fa", "ur"];
    const prefixed = langs.map(c => `${c}-`);
    return _(langs).includes(code) || prefixed.filter(c => code && code.startsWith(c)).length > 0;
};

const configI18n = ({ keyUiLocale }: { keyUiLocale: string }) => {
    // d2UiComponentsI18n.changeLanguage(keyUiLocale);
    userExtendedI18n.changeLanguage(keyUiLocale);
    // d2I18n.changeLanguage(keyUiLocale);
    document.documentElement.setAttribute("dir", isLangRTL(keyUiLocale) ? "rtl" : "ltr");
    // console.log("d2UiComponentsI18n languages:", d2UiComponentsI18n.languages);
    // console.log("d2UiComponentsI18n translations:", d2UiComponentsI18n.options);

    console.log("userExtendedI18n languages:", userExtendedI18n.languages);
    console.log("userExtendedI18n translations:", userExtendedI18n.options);

    // console.log("d2I18n languages:", d2I18n.languages);
    // console.log("d2I18n translations:", d2I18n.options);
};

/**  @deprecated
 *
 */
const initDeprecatedI18n = (legacyI18n: LegacyD2I18n, { keyUiLocale }: { keyUiLocale: string }) => {
    if (keyUiLocale && keyUiLocale !== "en") {
        // Add the language sources for the preferred locale
        legacyI18n.addSource(`old-i18n/i18n_module_${keyUiLocale}.properties`);
    }

    // Add english as locale for all cases (either as primary or fallback)
    legacyI18n.addSource("old-i18n/i18n_module_en.properties");
    legacyI18n.load();

    console.log(legacyI18n.translations);
};

async function main() {
    const baseUrl = await getBaseUrl();

    try {
        const d2 = await init({
            baseUrl: baseUrl + "/api",
            headers:
                isDev && process.env.REACT_APP_DHIS2_AUTH
                    ? { Authorization: `Basic ${btoa(process.env.REACT_APP_DHIS2_AUTH)}` }
                    : undefined,
        });

        const instance = new Instance({ url: baseUrl });
        const api = getD2APiFromInstance(instance);
        if (isDev) window.api = api;

        const userSettings = await api.get<{ keyUiLocale: string }>("/userSettings").getData();
        configI18n(userSettings);
        initDeprecatedI18n(d2.i18n, userSettings);

        ReactDOM.render(
            <Provider config={{ baseUrl, apiVersion: 30 }}>
                <App api={api} d2={d2} instance={instance} />
            </Provider>,
            document.getElementById("root")
        );
    } catch (err: any) {
        console.error(err);
        const feedback = err.toString().match("Unable to get schemas") ? (
            <h3 style={{ margin: 20 }}>
                <a rel="noopener noreferrer" target="_blank" href={baseUrl}>
                    Login
                </a>
            </h3>
        ) : (
            <h3>{err.toString()}</h3>
        );
        ReactDOM.render(<div>{feedback}</div>, document.getElementById("root"));
    }
}

main();
