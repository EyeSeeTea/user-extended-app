import { HeaderBar } from "../../components/header-bar/HeaderBar";
import { LoadingProvider, SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { MuiThemeProvider } from "@material-ui/core/styles";
import _ from "lodash";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React, { useEffect, useState } from "react";
import { appConfig } from "../../../app-config";
import { getCompositionRoot, SettingsStorageType } from "../../../CompositionRoot";
import { Instance } from "../../../data/entities/Instance";
import { D2Api } from "../../../types/d2-api";
import Share from "../../components/share/Share";
import { AppContext, AppContextState } from "../../contexts/app-context";
import { Router } from "../Router";
import "./App.css";
import muiThemeLegacy from "./themes/dhis2-legacy.theme";
import { muiTheme } from "./themes/dhis2.theme";
import { Feedback, FeedbackOptions } from "@eyeseetea/feedback-component";
import { AppSettingsProvider, useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { Maybe } from "../../../types/utils";
import { getMuiLocalization } from "./themes/muiLocales";

export interface AppProps {
    api: D2Api;
    d2: D2;
    instance: Instance;
    keyUiLocale: string;
}

export const App: React.FC<AppProps> = React.memo(function App({ api, d2, instance, keyUiLocale }) {
    const [showShareButton, setShowShareButton] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appContext, setAppContext] = useState<AppContextState | null>(null);
    const [username, setUsername] = useState("");

    const appTheme = React.useMemo(() => {
        const parts = keyUiLocale.split("_");
        const language = parts[0];
        const fallbackLocalization = getMuiLocalization("en", "US");

        if (!language) return muiTheme(fallbackLocalization);

        const country = parts[1] ?? language.toUpperCase();

        console.debug(`Setting app theme for language: ${language}, country: ${country}`);
        const localization = getMuiLocalization(language, country);

        return muiTheme(localization);
    }, [keyUiLocale]);

    useEffect(() => {
        async function setup() {
            const storageName = (process.env.REACT_APP_STORAGE as Maybe<SettingsStorageType>) || "dataStore";
            const compositionRoot = getCompositionRoot(instance, storageName);
            const { data: currentUser } = await compositionRoot.users.getCurrent().runAsync();
            if (!currentUser) throw new Error("User not logged in");

            const isShareButtonVisible = _(appConfig).get("appearance.showShareButton") || false;

            // TODO: Remove d2
            setAppContext({ d2, api, currentUser, compositionRoot });
            setUsername(currentUser.username);
            setShowShareButton(isShareButtonVisible);
            setLoading(false);
        }
        setup();
    }, [d2, api, instance]);

    if (loading) return null;

    return (
        <MuiThemeProvider theme={appTheme}>
            <OldMuiThemeProvider muiTheme={muiThemeLegacy}>
                <SnackbarProvider>
                    <LoadingProvider>
                        <AppContext.Provider value={appContext}>
                            <AppSettingsProvider>
                                <HeaderBar appName="User Extended" />

                                <div id="app" className="content">
                                    <Router />
                                </div>

                                <Share visible={showShareButton} />
                                <FeedbackWrapper options={appConfig.feedback} username={username} />
                            </AppSettingsProvider>
                        </AppContext.Provider>
                    </LoadingProvider>
                </SnackbarProvider>
            </OldMuiThemeProvider>
        </MuiThemeProvider>
    );
});

type D2 = object;

interface FeedbackProps {
    options: FeedbackOptions;
    username: string;
}

const FeedbackWrapper: React.FC<FeedbackProps> = ({ options, username }) => {
    const { appSettings } = useAppSettingsContext();
    if (!appSettings.showFeedback) return null;
    return <Feedback options={options} username={username} />;
};
