import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import React from "react";
import { Id } from "../../domain/entities/Ref";
import { User, UserColumns } from "../../domain/entities/User";
import { UserIdentifier } from "../../domain/entities/UserIdentifier";
import { UpdateStrategy, AccessElements, ListOptions } from "../../domain/repositories/UserRepository";
import { SaveUserOrgUnitOptions } from "../../domain/usecases/SaveUserOrgUnitUseCase";
import { useAppContext } from "../contexts/app-context";
import i18n from "../../utils/i18n";
import { AllowedExportFormat, ColumnMappingKeys } from "../../domain/usecases/ExportUsersUseCase";
import FileSaver from "file-saver";
import { OrgUnitKey } from "../../domain/entities/OrgUnit";
import { AppSettings } from "../../domain/entities/AppSettings";
import { Maybe } from "../../types/utils";
import { useAppSettingsContext } from "../contexts/AppSettingsProvider";
import { Column } from "../../domain/entities/UserColumn";
import { UserProps } from "../../domain/entities/UserProps";

type UseSaveUsersOrgUnitsProps = { onSuccess: () => void };
type UseExportUsersProps = {
    onSuccess: () => void;
    columns: ColumnMappingKeys[];
    filterOptions: ListOptions;
    orgUnitsField: OrgUnitKey;
};

type UseCopyInUserProps = { onSuccess: () => void };

type UseVisibleColumnsProps = {
    appSettings: Maybe<AppSettings>;
    user: UserProps;
    onChangeVisibleColumns: (columns: UserColumns[]) => void;
    columnsKey: string;
};

export function useGetUsersByIds(ids: Id[]) {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const loading = useLoading();
    const [users, setUsers] = React.useState<User[]>();

    React.useEffect(() => {
        if (ids.length === 0) return;
        loading.show(true);
        return compositionRoot.users.get(ids).run(
            users => {
                setUsers(users);
                loading.hide();
            },
            error => {
                snackbar.error(error);
            }
        );
    }, [compositionRoot.users, ids, loading, snackbar]);

    return { setUsers, users };
}

export function useSaveUsersOrgUnits(props: UseSaveUsersOrgUnitsProps) {
    const { onSuccess } = props;
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const loading = useLoading();

    const saveUsersOrgUnits = React.useCallback(
        (
            orgUnitIds: Id[],
            updateStrategy: UpdateStrategy,
            users: User[],
            orgUnitType: SaveUserOrgUnitOptions["orgUnitType"]
        ) => {
            loading.show(true, i18n.t("Saving..."));
            return compositionRoot.users
                .saveOrgUnits({
                    orgUnitsIds: orgUnitIds,
                    updateStrategy: updateStrategy,
                    users: users,
                    orgUnitType,
                })
                .run(
                    () => {
                        onSuccess();
                        loading.hide();
                    },
                    error => {
                        snackbar.error(error);
                        loading.hide();
                    }
                );
        },
        [compositionRoot.users, onSuccess, snackbar, loading]
    );

    return { saveUsersOrgUnits };
}

export function useGetAllUsers(onlyUsersOrgUnits: boolean) {
    const { compositionRoot } = useAppContext();
    const { appSettings } = useAppSettingsContext();
    const [users, setUsers] = React.useState<User[]>();
    const snackbar = useSnackbar();

    React.useMemo(() => {
        compositionRoot.users
            .listAll({
                onlyUsersOrgUnits: onlyUsersOrgUnits,
                onlyActiveUsers: appSettings.showOnlyActiveUsers,
                hideUsers: appSettings.hide.users,
            })
            .run(
                allUsers => {
                    setUsers(allUsers);
                },
                error => {
                    snackbar.error(error);
                }
            );
    }, [appSettings.hide.users, appSettings.showOnlyActiveUsers, onlyUsersOrgUnits, compositionRoot.users, snackbar]);

    return { users };
}

export function useGetAllUserIdentifiers(onlyUsersOrgUnits: boolean) {
    const { compositionRoot } = useAppContext();
    const { appSettings } = useAppSettingsContext();
    const [userIdentifiers, setUserIdentifiers] = React.useState<UserIdentifier[]>([]);
    const snackbar = useSnackbar();

    React.useMemo(() => {
        compositionRoot.users
            .listAllIdentifiers({
                onlyUsersOrgUnits: onlyUsersOrgUnits,
                onlyActiveUsers: appSettings.showOnlyActiveUsers,
                hideUsers: appSettings.hide.users,
            })
            .run(
                allUserIdentifiers => {
                    setUserIdentifiers(allUserIdentifiers);
                },
                error => {
                    snackbar.error(error);
                }
            );
    }, [compositionRoot, snackbar, appSettings.hide.users, appSettings.showOnlyActiveUsers, onlyUsersOrgUnits]);

    return { userIdentifiers };
}

export function useCopyInUser(props: UseCopyInUserProps) {
    const { onSuccess } = props;
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const loading = useLoading();

    const copyInUser = React.useCallback(
        (user: User, selectedUsersIds: Id[], updateStrategy: UpdateStrategy, accessElements: AccessElements) => {
            loading.show(true, i18n.t("Saving..."));
            return compositionRoot.users
                .copyInUser({
                    user,
                    selectedUsersIds,
                    updateStrategy,
                    accessElements,
                })
                .run(
                    () => {
                        onSuccess();
                        loading.hide();
                    },
                    error => {
                        snackbar.error(error);
                        loading.hide();
                    }
                );
        },
        [compositionRoot.users, onSuccess, snackbar, loading]
    );

    return { copyInUser };
}

export const useExportUsers = (props: UseExportUsersProps) => {
    const { onSuccess, columns, filterOptions, orgUnitsField } = props;

    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const loading = useLoading();

    const exportUsers = React.useCallback(
        (name: string, format: AllowedExportFormat, isEmptyTemplate: boolean) => {
            loading.show();

            const exportOptions = {
                name,
                columns,
                filterOptions,
                format,
                orgUnitsField,
                isEmptyTemplate,
            };
            return compositionRoot.users.export(exportOptions).run(
                ({ blob, filename }) => {
                    FileSaver.saveAs(blob, filename);
                    onSuccess();
                    snackbar.success(i18n.t("Table exported: {{filename}}", { filename, nsSeparator: false }));
                    loading.hide();
                },
                error => {
                    snackbar.error(error);
                    loading.hide();
                }
            );
        },
        [columns, compositionRoot.users, filterOptions, onSuccess, snackbar, loading, orgUnitsField]
    );

    return {
        exportUsersToCSV: React.useCallback(() => exportUsers("users", "csv", false), [exportUsers]),
        exportUsersToJSON: React.useCallback(() => exportUsers("users", "json", false), [exportUsers]),
        exportEmptyTemplate: React.useCallback(() => exportUsers("empty-user-template", "csv", true), [exportUsers]),
    };
};

export const useColumnsPreferences = (props: UseVisibleColumnsProps) => {
    const { columnsKey, appSettings, user, onChangeVisibleColumns } = props;

    const [columnsPreferences, setColumnsPreferences] = React.useState<Column[]>();

    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    React.useEffect(() => {
        console.debug("Loading columns preferences for key:", columnsKey);
        return compositionRoot.users.getColumns(user).run(
            columnsPreferences => {
                setColumnsPreferences(columnsPreferences);
                onChangeVisibleColumns(columnsPreferences.map(col => col.fieldName));
            },
            error => snackbar.error(error)
        );
    }, [appSettings?.columns, compositionRoot, snackbar, user, onChangeVisibleColumns, columnsKey]);

    return { columnsPreferences };
};
