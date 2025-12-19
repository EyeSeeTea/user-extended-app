import React from "react";
import styled from "styled-components";
import { Tabs, Tab, Dialog } from "@material-ui/core";
import i18n from "../../../utils/i18n";
import Settings from "../../../legacy/models/settings";
import { useAppContext } from "../../contexts/app-context";
import SettingsDialog from "../../../legacy/components/SettingsDialog.component";
import { LoggerSettingsPage } from "../../pages/log-settings/LoggerSettingsPage";
import { Maybe } from "../../../types/utils";
import { ColumnsSettingsPage } from "../columns-settings/ColumnsSettingsPage";
import {
    AppSettings,
    SettingsUserColumn,
    SettingsRoleColumn,
    SettingsDashboardColumn,
    SettingsGroupColumn,
} from "../../../domain/entities/AppSettings";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { PermissionsPage } from "../permissions-page/PermissionsPage";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { useUserColumns } from "../user-list-table/userColumns";

type SettingsOption = "import" | "logger" | "columns" | "permissions" | "user-permissions" | "filter-permissions";

type SettingsDialogModalProps = {
    onCloseAppSettings: (appSettings: AppSettings) => void;
    onClose: (settings: Maybe<Settings>) => void;
    d2: any;
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
    const { onClose, onCloseAppSettings, d2 } = props;
    const [selectedTab, setSelectedTab] = React.useState<SettingsOption>("import");
    const { importSettings } = useImportSettings();
    const { save, appSettings: initialData } = useAppSettingsContext();
    const [appSettings, setAppSettings] = React.useState<AppSettings>(initialData);
    const userColumns = useUserColumns();

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

    const updateColumns = React.useCallback(
        (columns: SettingsUserColumn[]) => {
            const updatedSettings = appSettings.updateColumns(columns);
            setAppSettings(updatedSettings);
        },
        [appSettings, setAppSettings]
    );

    const updateRoleColumns = React.useCallback(
        (columns: SettingsRoleColumn[]) => {
            const updatedSettings = appSettings.updateRoleColumns(columns);
            setAppSettings(updatedSettings);
        },
        [appSettings, setAppSettings]
    );

    const updateDashboardColumns = React.useCallback(
        (columns: SettingsDashboardColumn[]) => {
            const updatedSettings = appSettings.updateDashboardColumns(columns);
            setAppSettings(updatedSettings);
        },
        [appSettings, setAppSettings]
    );

    const updateGroupColumns = React.useCallback(
        (columns: SettingsGroupColumn[]) => {
            const updatedSettings = appSettings.updateGroupColumns(columns);
            setAppSettings(updatedSettings);
        },
        [appSettings, setAppSettings]
    );

    const roleColumnsMetadata = React.useMemo(
        () => [
            { name: "name", text: i18n.t("Name") },
            { name: "description", text: i18n.t("Description") },
            { name: "users", text: i18n.t("Users") },
        ],
        []
    );

    const dashboardColumnsMetadata = React.useMemo(
        () => [
            { name: "name", text: i18n.t("Name") },
            { name: "description", text: i18n.t("Description") },
            { name: "owner", text: i18n.t("Owner") },
            { name: "users", text: i18n.t("Users") },
        ],
        []
    );

    const groupColumnsMetadata = React.useMemo(
        () => [
            { name: "name", text: i18n.t("Name") },
            { name: "users", text: i18n.t("Users") },
        ],
        []
    );

    const saveSettings = React.useCallback(() => {
        onSaveData(appSettings);
    }, [appSettings, onSaveData]);

    const closeDialog = React.useCallback(() => {
        onClose(undefined);
    }, [onClose]);

    const renderSelectedTab = (tab: SettingsOption) => {
        switch (tab) {
            case "import":
                return importSettings && <SettingsDialog d2={d2} settings={importSettings} onRequestClose={onClose} />;
            case "logger":
                return <LoggerSettingsPage onClose={closeDialog} />;
            case "columns":
                return (
                    <ColumnsContainer>
                        <ColumnsSettingsPage
                            columns={appSettings.columns}
                            columnsMetadata={userColumns}
                            onUpdateColumns={updateColumns}
                            onClose={closeDialog}
                            onSave={saveSettings}
                            title={i18n.t("User Columns")}
                            showActions
                        />
                        <ColumnsSettingsPage
                            columns={appSettings.groupColumns}
                            columnsMetadata={groupColumnsMetadata}
                            onUpdateColumns={updateGroupColumns}
                            onClose={closeDialog}
                            onSave={saveSettings}
                            title={i18n.t("Group Columns")}
                        />
                        <ColumnsSettingsPage
                            columns={appSettings.roleColumns}
                            columnsMetadata={roleColumnsMetadata}
                            onUpdateColumns={updateRoleColumns}
                            onClose={closeDialog}
                            onSave={saveSettings}
                            title={i18n.t("Role Columns")}
                        />
                        <ColumnsSettingsPage
                            columns={appSettings.dashboardColumns}
                            columnsMetadata={dashboardColumnsMetadata}
                            onUpdateColumns={updateDashboardColumns}
                            onClose={closeDialog}
                            onSave={saveSettings}
                            title={i18n.t("Dashboard Columns")}
                        />
                    </ColumnsContainer>
                );
            case "user-permissions":
                return <PermissionsPage onSave={onSaveData} onClose={closeDialog} permissionsGroup="users" />;
            case "permissions":
                return <PermissionsPage onSave={onSaveData} onClose={closeDialog} permissionsGroup="global" />;
            case "filter-permissions":
                return <PermissionsPage onSave={onSaveData} onClose={closeDialog} permissionsGroup="filter" />;
        }
    };

    return (
        <Dialog open maxWidth="lg" fullWidth onClose={closeDialog}>
            <Tabs value={selectedTab} onChange={(_event, value) => onChangeTab(value)}>
                <Tab label={i18n.t("Import")} value="import" />
                <Tab label={i18n.t("Logger")} value="logger" />
                <Tab label={i18n.t("Permissions")} value="permissions" />
                <Tab label={i18n.t("User Permissions")} value="user-permissions" />
                <Tab label={i18n.t("Columns")} value="columns" />
                <Tab label={i18n.t("Filter Permissions")} value="filter-permissions" />
            </Tabs>

            {renderSelectedTab(selectedTab)}
        </Dialog>
    );
};

const ColumnsContainer = styled.div`
    padding: 2em;
`;
