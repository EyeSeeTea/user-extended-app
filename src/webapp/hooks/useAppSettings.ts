import React from "react";
import { TableColumn, useSnackbar } from "@eyeseetea/d2-ui-components";

import { User } from "../../domain/entities/User";
import { AppSettings, SettingsUserColumn } from "../../domain/entities/AppSettings";
import { useAppContext } from "../contexts/app-context";
import { useUserColumns } from "../components/user-list-table/UserListTable";

function getColumnsOrDefault(defaultColumns: TableColumn<User>[], appSettings: AppSettings): SettingsUserColumn[] {
    return appSettings.columns && appSettings.columns.length > 0
        ? appSettings.columns
        : defaultColumns.map(column => {
              return { field: column.name, value: "optional" };
          });
}

export function useAppSettings() {
    const { compositionRoot } = useAppContext();
    const [appSettings, setAppSettings] = React.useState<AppSettings>(AppSettings.emptySettings());
    const userColumns = useUserColumns();
    const snackbar = useSnackbar();

    React.useEffect(() => {
        return compositionRoot.settings.get.execute().run(
            result => {
                const columns = getColumnsOrDefault(userColumns, result);
                setAppSettings(result.updateColumns(columns));
            },
            err => {
                snackbar.error(err);
            }
        );
    }, [compositionRoot.settings.get, snackbar, userColumns]);

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

    return { appSettings, save, setAppSettings };
}
