import _ from "lodash";
import axios from "axios";
import ReactDOM from "react-dom";
import { Provider } from "@dhis2/app-runtime";
import { init } from "d2/lib/d2";

import { Instance } from "./data/entities/Instance";
import { D2Api } from "./types/d2-api";
import { getD2APiFromInstance } from "./utils/d2-api";
import { App } from "./webapp/pages/app/App";
import { LegacyD2I18n } from "./types/d2-legacy-i18n";
import i18n from "./utils/i18n";
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
    i18n.changeLanguage(keyUiLocale);
    console.debug(`i18n language set to ${i18n.language}`);
    document.documentElement.setAttribute("dir", isLangRTL(keyUiLocale) ? "rtl" : "ltr");
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
                <App api={api} d2={d2} instance={instance} keyUiLocale={userSettings.keyUiLocale} />
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
