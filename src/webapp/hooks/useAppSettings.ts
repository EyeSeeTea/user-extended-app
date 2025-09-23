import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";

import { AppSettings } from "../../domain/entities/AppSettings";
import { useAppContext } from "../contexts/app-context";

export function useAppSettings() {
    const { compositionRoot } = useAppContext();
    const [appSettings, setAppSettings] = React.useState<AppSettings>(AppSettings.defaultSettings());
    const [hasLoaded, setHasLoaded] = React.useState(false);
    const snackbar = useSnackbar();

    React.useEffect(() => {
        return compositionRoot.settings.get.execute().run(
            result => {
                setAppSettings(result);
                setHasLoaded(true);
            },
            err => {
                snackbar.error(err);
                setHasLoaded(true);
            }
        );
    }, [compositionRoot.settings.get, snackbar]);

    const save = React.useCallback(
        (settings: AppSettings, onSuccess: () => void, onError: (message: string) => void) => {
            compositionRoot.settings.save.execute({ appSettings: settings }).run(
                updatedSettings => {
                    setAppSettings(updatedSettings);
                    onSuccess();
                },
                err => {
                    onError(err);
                }
            );
        },
        [compositionRoot.settings.save]
    );

    return { appSettings, save, setAppSettings, hasLoaded };
}
