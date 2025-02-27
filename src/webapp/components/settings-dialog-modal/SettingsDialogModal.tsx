import React from "react";
import { Tabs, Tab, Dialog } from "@material-ui/core";
import i18n from "../../../locales";
import Settings from "../../../legacy/models/settings";
import { useAppContext } from "../../contexts/app-context";
import SettingsDialog from "../../../legacy/components/SettingsDialog.component";
import { LoggerSettingsPage } from "../../pages/log-settings/LoggerSettingsPage";
import { Maybe } from "../../../types/utils";
import { ColumnsSettingsPage } from "../columns-settings/ColumnsSettingsPage";
import { AppSettings, SettingsUserColumn } from "../../../domain/entities/AppSettings";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { PermissionsPage } from "../permissions-page/PermissionsPage";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";

type SettingsOption = "import" | "logger" | "columns" | "permissions";

type SettingsDialogModalProps = {
    onCloseAppSettings: (appSettings: AppSettings) => void;
    onClose: (settings: Maybe<Settings>) => void;
};

export function useImportSettings() {
    const { d2 } = useAppContext();
    const [importSettings, setSettings] = React.useState<Settings>();

    React.useEffect(() => {
        Settings.build(d2).then((settings: Settings) => {
            setSettings(settings);
        });
    }, [d2]);

    return { importSettings };
}

export const SettingsDialogModal: React.FC<SettingsDialogModalProps> = props => {
    const { onClose, onCloseAppSettings } = props;
    const [selectedTab, setSelectedTab] = React.useState<SettingsOption>("import");
    const { importSettings } = useImportSettings();
    const { appSettings, save, setAppSettings } = useAppSettingsContext();

    const loading = useLoading();
    const snackbar = useSnackbar();

    function onChangeTab(value: SettingsOption) {
        setSelectedTab(value);
    }

    const onSaveData = React.useCallback(
        (data: AppSettings) => {
            loading.show(true, i18n.t("Saving..."));
            save(
                data,
                () => {
                    loading.hide();
                    onCloseAppSettings(data);
                },
                message => {
                    loading.hide();
                    snackbar.error(message);
                }
            );
        },
        [loading, onCloseAppSettings, save, snackbar]
    );

    const saveColumns = React.useCallback(
        (columns: SettingsUserColumn[]) => {
            if (!appSettings) return;
            const updatedSettings = appSettings.updateColumns(columns);
            setAppSettings(updatedSettings);
        },
        [appSettings, setAppSettings]
    );

    const saveSettings = React.useCallback(() => {
        onSaveData(appSettings);
    }, [appSettings, onSaveData]);

    const onSavePermissions = React.useCallback(
        updatedSettings => {
            onSaveData(updatedSettings);
        },
        [onSaveData]
    );

    const closeDialog = React.useCallback(() => {
        onClose(undefined);
    }, [onClose]);

    const renderSelectedTab = (tab: SettingsOption) => {
        switch (tab) {
            case "import":
                return importSettings && <SettingsDialog settings={importSettings} onRequestClose={onClose} />;
            case "logger":
                return <LoggerSettingsPage onClose={closeDialog} />;
            case "columns":
                return (
                    <ColumnsSettingsPage
                        appSettings={appSettings}
                        onUpdateColumns={saveColumns}
                        onClose={closeDialog}
                        onSave={saveSettings}
                    />
                );
            case "permissions":
                return <PermissionsPage onSave={onSavePermissions} onClose={closeDialog} />;
        }
    };

    return (
        <Dialog open maxWidth="lg" fullWidth onClose={closeDialog}>
            <Tabs value={selectedTab} onChange={(_event, value) => onChangeTab(value)}>
                <Tab label={i18n.t("Import")} value="import" />
                <Tab label={i18n.t("Logger")} value="logger" />
                <Tab label={i18n.t("Columns")} value="columns" />
                <Tab label={i18n.t("Permissions")} value="permissions" />
            </Tabs>

            {renderSelectedTab(selectedTab)}
        </Dialog>
    );
};
