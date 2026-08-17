import React, { useEffect } from "react";
import Settings from "../../legacy/models/settings";
import { useAppContext } from "../contexts/app-context";

export function useImportSettings() {
    const { d2 } = useAppContext();
    const [importSettings, setImportSettings] = React.useState<Settings>();

    useEffect(() => {
        Settings.build(d2).then((settings: Settings) => {
            setImportSettings(settings);
        });
    }, [d2]);

    return { importSettings: importSettings, setImportSettings: setImportSettings };
}
