import {
    ObjectsList,
    ObjectsTableProps,
    Pager,
    TableAction,
    TableColumn,
    TableConfig,
    TablePagination,
    TableSorting,
    useObjectsTable,
    useSnackbar,
} from "@eyeseetea/d2-ui-components";
import { Icon, Tooltip } from "@material-ui/core";
import { Check, Tune } from "@material-ui/icons";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import _ from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { checkAccess, checkHasEmail, hasReplicateAuthority, User } from "../../../domain/entities/User";
import { ListFilters, UpdateStrategy, AccessElements, ListOptions } from "../../../domain/repositories/UserRepository";
import { SaveUserOrgUnitOptions } from "../../../domain/usecases/SaveUserOrgUnitUseCase";
import i18n from "../../../utils/i18n";
import { Maybe } from "../../../types/utils";
import { useAppContext } from "../../contexts/app-context";
import { useReload } from "../../hooks/useReload";
import {
    useCopyInUser,
    useGetAllUsers,
    useGetUsersByIds,
    useSaveUsersOrgUnits,
    useVisibleColumns,
} from "../../hooks/userHooks";
import { MultiSelectorDialog, MultiSelectorDialogProps } from "../multi-selector-dialog/MultiSelectorDialog";
import { OrgUnitDialogSelector } from "../orgunit-dialog-selector/OrgUnitDialogSelector";
import { CopyInUserDialog } from "../copy-in-user-dialog/CopyInUserDialog";
import {
    ActionType,
    OrgUnitActionType,
    generateMessage,
    getFirstThreeUserNames,
    UsersSelectedModal,
    RiskyActionType,
} from "../users-remove-modal/UsersSelectedModal";
import { SettingsDialogModal, useImportSettings } from "../settings-dialog-modal/SettingsDialogModal";
import Settings from "../../../legacy/models/settings";
import { ImportExport, ImportResult } from "../import-export/ImportExport";
import { ColumnMappingKeys } from "../../../domain/usecases/ExportUsersUseCase";
import { ImportTable } from "../import-export/ImportTable";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { PaginatedResponse } from "../../../domain/entities/PaginatedResponse";
import styled from "styled-components";
import { getUserActionLabel, UserAction } from "../../../domain/entities/UserAction";

function convertActionToOrgUnitType(action: OrgUnitActionType): SaveUserOrgUnitOptions["orgUnitType"] {
    switch (action) {
        case "assign_to_org_units_capture":
            return "capture";
        case "assign_to_org_units_output":
            return "output";
        case "assign_to_org_units_search":
            return "search";
    }
}

function isActionTypeOrgUnit(actionType: Maybe<ActionType>): actionType is OrgUnitActionType {
    return (
        actionType === "assign_to_org_units_capture" ||
        actionType === "assign_to_org_units_output" ||
        actionType === "assign_to_org_units_search"
    );
}

function isActionTypeRisky(actionType: Maybe<ActionType>): actionType is RiskyActionType {
    return (
        actionType === "disable" ||
        actionType === "enable" ||
        actionType === "remove" ||
        actionType === "reset_password"
    );
}

function isActionTypeCopyInUser(actionType: Maybe<ActionType>): boolean {
    return actionType === "copy_in_user";
}

function buildOrgUnitTitleByAction(
    actionType: ActionType,
    ouCapture: string,
    ouOutput: string,
    ouSearch: string
): string {
    switch (actionType) {
        case "assign_to_org_units_capture":
            return ouCapture;
        case "assign_to_org_units_output":
            return ouOutput;
        case "assign_to_org_units_search":
            return ouSearch;
        default:
            return "";
    }
}

export const UserListTable: React.FC<UserListTableProps> = ({
    openSettings,
    onChangeVisibleColumns,
    onChangeSearch,
    filters,
    canManage,
    rootJunction,
    children,
    reloadTableKey,
    onAction,
    filterOption,
}) => {
    const { compositionRoot, currentUser } = useAppContext();
    const [reloadKey, reload] = useReload();

    const [multiSelectorDialogProps, openMultiSelectorDialog] = useState<MultiSelectorDialogProps>();
    // const [visibleColumns, setVisibleColumns] = useState<Array<keyof User>>();
    const [mappingColumns, setMappingColumns] = useState<ColumnMappingKeys[]>();
    const [selectedUserIds, setSelectedUserIds] = useState<Id[]>([]);
    const [actionType, setActionType] = useState<ActionType>();
    const [showSettings, setShowSettings] = React.useState(false);
    const [showImportModal, setShowImportModal] = React.useState(false);
    const [importResult, setImportResult] = React.useState<ImportResult>();
    const [currentUserHasAccessToSettings, setCurrentUserHasAccessToSettings] = React.useState(false);

    const { importSettings } = useImportSettings();

    const enableReplicate = hasReplicateAuthority(currentUser);
    const snackbar = useSnackbar();
    const navigate = useNavigate();
    const userColumns = useUserColumns();

    const { users, setUsers } = useGetUsersByIds(selectedUserIds);
    const { users: allUsers } = useGetAllUsers();
    const { appSettings, setAppSettings } = useAppSettingsContext();
    const {
        showOnlyUsersOrgUnits: onlyUsersOrgUnits,
        showOnlyActiveUsers: onlyActiveUsers,
        hide: { users: hideUsers },
    } = appSettings;
    const { visibleColumns } = useVisibleColumns({ appSettings, onChangeVisibleColumns });

    const currentUserAccessibleActions = useMemo(
        () => compositionRoot.users.checkActionsAccessibleToCurrentUser(currentUser, appSettings.actionsAccess),
        [compositionRoot.users, currentUser, appSettings.actionsAccess]
    );

    /* Pagination DHIS2 Bug */
    const needsPatch =
        onlyUsersOrgUnits && Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null).length > 0;

    const onCleanSelectedUsers = React.useCallback(() => {
        setSelectedUserIds([]);
        setUsers(undefined);
        setActionType(undefined);
    }, [setUsers]);

    const { saveUsersOrgUnits } = useSaveUsersOrgUnits({
        onSuccess: React.useCallback(() => {
            onCleanSelectedUsers();
            reload();
        }, [onCleanSelectedUsers, reload]),
    });

    const { copyInUser } = useCopyInUser({
        onSuccess: React.useCallback(() => {
            onCleanSelectedUsers();
            reload();
        }, [onCleanSelectedUsers, reload]),
    });

    const editUsers = useCallback(
        (ids: string[]) => {
            if (ids.length === 1) {
                navigate(`/edit/${ids[0]}`);
            } else {
                compositionRoot.users.get(ids).run(
                    users => navigate(`/bulk-edit`, { state: { users: users } }),
                    error => snackbar.error(error)
                );
            }
        },
        [navigate, compositionRoot, snackbar]
    );

    const onReorderColumns = useCallback(
        (columns: ColumnMappingKeys[]) => {
            if (!visibleColumns || !columns.length) return;
            onChangeVisibleColumns(columns);
            setMappingColumns(columns);
            compositionRoot.users.saveColumns(columns).run(
                () => {},
                error => snackbar.error(error)
            );
        },
        [compositionRoot, visibleColumns, onChangeVisibleColumns, snackbar]
    );

    const actions: TableAction<User>[] = useMemo(
        () =>
            [
                {
                    name: UserAction.DETAILS,
                    text: getUserActionLabel(UserAction.DETAILS),
                    multiple: false,
                    primary: true,
                },
                {
                    name: UserAction.EDIT,
                    text: getUserActionLabel(UserAction.EDIT),
                    icon: <Icon>edit</Icon>,
                    multiple: true,
                    onClick: editUsers,
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.COPY_IN_USER,
                    text: getUserActionLabel(UserAction.COPY_IN_USER),
                    icon: <Icon>content_copy</Icon>,
                    multiple: false,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("copy_in_user");
                    },
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE,
                    text: getUserActionLabel(UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE),
                    multiple: true,
                    icon: <Icon>business</Icon>,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("assign_to_org_units_capture");
                    },
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT,
                    text: getUserActionLabel(UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT),
                    multiple: true,
                    icon: <Icon>business</Icon>,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("assign_to_org_units_output");
                    },
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.ASSIGN_TO_ORG_UNITS_SEARCH,
                    text: getUserActionLabel(UserAction.ASSIGN_TO_ORG_UNITS_SEARCH),
                    multiple: true,
                    icon: <Icon>business</Icon>,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("assign_to_org_units_search");
                    },
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.ASSIGN_ROLES,
                    text: getUserActionLabel(UserAction.ASSIGN_ROLES),
                    multiple: true,
                    icon: <Icon>assignment</Icon>,
                    onClick: (users: string[]) =>
                        openMultiSelectorDialog({
                            type: "userRoles",
                            ids: users,
                            onClose: () => {
                                openMultiSelectorDialog(undefined);
                                reload();
                            },
                        }),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.ASSIGN_GROUPS,
                    text: getUserActionLabel(UserAction.ASSIGN_GROUPS),
                    icon: <Icon>group_add</Icon>,
                    multiple: true,
                    onClick: (users: string[]) =>
                        openMultiSelectorDialog({
                            type: "userGroups",
                            ids: users,
                            onClose: () => {
                                openMultiSelectorDialog(undefined);
                                reload();
                            },
                        }),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: UserAction.ENABLE,
                    text: getUserActionLabel(UserAction.ENABLE),
                    icon: <Icon>playlist_add_check</Icon>,
                    multiple: true,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("enable");
                    },
                    isActive: isStateActionVisible("enable"),
                },
                {
                    name: UserAction.DISABLE,
                    text: getUserActionLabel(UserAction.DISABLE),
                    icon: <Icon>block</Icon>,
                    multiple: true,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("disable");
                    },
                    isActive: isStateActionVisible("disable"),
                },
                {
                    name: UserAction.RESET_PASSWORD,
                    text: getUserActionLabel(UserAction.RESET_PASSWORD),
                    icon: <Icon>lock</Icon>,
                    multiple: true,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("reset_password");
                    },
                    isActive: (users: User[]) => checkHasEmail(users),
                },
                {
                    name: UserAction.REMOVE,
                    text: getUserActionLabel(UserAction.REMOVE),
                    icon: <Icon>delete</Icon>,
                    multiple: true,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("remove");
                    },
                    isActive: checkAccess(["delete"]),
                },
                {
                    name: UserAction.REPLICATE_USER_FROM_TEMPLATE,
                    text: getUserActionLabel(UserAction.REPLICATE_USER_FROM_TEMPLATE),
                    icon: <FileCopyIcon />,
                    multiple: false,
                    onClick: (users: string[]) => onAction(users, "replicate_template"),
                    isActive: () => enableReplicate,
                },
                {
                    name: UserAction.REPLICATE_USER_FROM_TABLE,
                    text: getUserActionLabel(UserAction.REPLICATE_USER_FROM_TABLE),
                    icon: <Icon>toc</Icon>,
                    multiple: false,
                    onClick: (users: string[]) => onAction(users, "replicate_table"),
                    isActive: () => enableReplicate,
                },
            ].filter(action => currentUserAccessibleActions[action.name]),
        [currentUserAccessibleActions, editUsers, enableReplicate, onAction, reload]
    );

    const baseConfig = useMemo((): TableConfig<User> => {
        return {
            columns: generateColumnsFromSettings({ appSettings, columns: userColumns }),
            details: [
                { name: "name", text: i18n.t("Name") },
                { name: "username", text: i18n.t("Username") },
                { name: "created", text: i18n.t("Created") },
                { name: "lastUpdated", text: i18n.t("Last updated") },
                { name: "lastLogin", text: i18n.t("Last login") },
                { name: "id", text: i18n.t("ID") },
                { name: "apiUrl", text: i18n.t("API URL") },
                { name: "email", text: i18n.t("Email") },
                { name: "openId", text: i18n.t("Open ID") },
                { name: "userRoles", text: i18n.t("Roles") },
                { name: "userGroups", text: i18n.t("Groups") },
                { name: "organisationUnits", text: i18n.t("OU Capture") },
                { name: "dataViewOrganisationUnits", text: i18n.t("OU Output") },
                { name: "searchOrganisationsUnits", text: i18n.t("OU Search") },
            ],
            actions: actions,
            globalActions: _.compact([
                currentUserHasAccessToSettings && {
                    name: "open-settings",
                    text: i18n.t("Settings"),
                    icon: <Tune />,
                    onClick: () => setShowSettings(true),
                },
            ]),
            // TODO: Bug in ObjectsList
            initialSorting: {
                field: "firstName",
                order: "asc",
            },
            initialState: {
                sorting: {
                    field: "firstName",
                    order: "asc",
                },
            },
            paginationOptions: {
                pageSizeOptions: [10, 25, 50, 100, 500, 1000],
                pageSizeInitialValue: 25,
            },
            searchBoxLabel: i18n.t("Search by name or username..."),
            // FIXME: Disabled as long as user creation via /new does not work.
            // onActionButtonClick: () => navigate("/new"),
            onReorderColumns,
        };
    }, [appSettings, userColumns, actions, currentUserHasAccessToSettings, onReorderColumns]);

    const refreshRows = useCallback(
        async (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<User>
        ): Promise<{ objects: User[]; pager: Pager }> => {
            console.debug("Reloading", reloadKey, reloadTableKey);
            onChangeSearch(search);

            // SEE: src/legacy/models/userList.js LINE 29+
            if (canManage === "true") {
                const userIdList = await compositionRoot.users
                    .listAllIds({
                        search,
                        sorting,
                        filters,
                        canManage,
                        rootJunction,
                        onlyUsersOrgUnits: onlyUsersOrgUnits,
                        onlyActiveUsers: onlyActiveUsers,
                        hideUsers: appSettings.hide.users,
                    })
                    .toPromise();

                if (userIdList) {
                    filters["id"] = ["in", userIdList];
                }
            }

            return compositionRoot.users
                .list({
                    search,
                    page,
                    pageSize,
                    sorting,
                    filters,
                    canManage,
                    rootJunction,
                    onlyUsersOrgUnits: onlyUsersOrgUnits,
                    onlyActiveUsers: onlyActiveUsers,
                    hideUsers: appSettings.hide.users,
                })
                .map(({ objects, pager }) => ({
                    pager,
                    objects: objects.map(
                        hideUserRolesAndUserGroups(appSettings.hide.userRoles, appSettings.hide.userGroups)
                    ),
                }))
                .map(paginatedReponse => patchPaginatedReponseIfNeeded(needsPatch, paginatedReponse))
                .toPromise();
        },
        [
            reloadKey,
            reloadTableKey,
            onChangeSearch,
            canManage,
            compositionRoot.users,
            filters,
            rootJunction,
            onlyUsersOrgUnits,
            onlyActiveUsers,
            appSettings.hide.users,
            appSettings.hide.userRoles,
            appSettings.hide.userGroups,
            needsPatch,
        ]
    );

    const refreshAllIds = useCallback(
        (search: string, sorting: TableSorting<User>): Promise<string[]> => {
            return compositionRoot.users
                .listAllIds({
                    search,
                    sorting,
                    filters,
                    canManage,
                    rootJunction,
                    onlyUsersOrgUnits: onlyUsersOrgUnits,
                    onlyActiveUsers: onlyActiveUsers,
                    hideUsers: appSettings.hide.users,
                })
                .toPromise();
        },
        [
            compositionRoot.users,
            filters,
            canManage,
            rootJunction,
            onlyUsersOrgUnits,
            onlyActiveUsers,
            appSettings.hide.users,
        ]
    );

    const tableProps = useObjectsTable(baseConfig, refreshRows, refreshAllIds);

    const columnsToShow = useMemo<TableColumn<User>[]>(() => {
        const indexes = _(visibleColumns)
            .map((columnName, idx) => [columnName, idx] as [string, number])
            .fromPairs()
            .value();

        return _(tableProps.columns)
            .map(column => ({ ...column, hidden: !visibleColumns?.includes(column.name) }))
            .sortBy(column => indexes[column.name] || 0)
            .value();
    }, [tableProps.columns, visibleColumns]);

    const onSuccessUsersRemove = () => {
        onCleanSelectedUsers();
        reload();
    };

    const ouCaptureI18n = i18n.t("Assign to organisation units capture");
    const ouOutputI18n = i18n.t("Assign to organisation units output");
    const ouSearchI18n = i18n.t("Assign to organisation units search");

    const onSaveOrgUnits = React.useCallback(
        (orgUnitIds: Id[], updateStrategy: UpdateStrategy) => {
            if (users && isActionTypeOrgUnit(actionType)) {
                saveUsersOrgUnits(orgUnitIds, updateStrategy, users, convertActionToOrgUnitType(actionType));
            }
        },
        [actionType, users, saveUsersOrgUnits]
    );

    const generateOrgUnitTitle = React.useMemo(() => {
        if (!users || !actionType) return "";
        return i18n.t("{{action}}: {{users}} {{remainingCount}}", {
            action: buildOrgUnitTitleByAction(actionType, ouCaptureI18n, ouOutputI18n, ouSearchI18n),
            users: getFirstThreeUserNames(users).join(", "),
            remainingCount: generateMessage(users),
            nsSeparator: "$noop$",
        });
    }, [actionType, users, ouCaptureI18n, ouOutputI18n, ouSearchI18n]);

    const selectedUser = useMemo(() => {
        if (!users || selectedUserIds.length !== 1) return undefined;
        return users.find(user => user.id === selectedUserIds[0]);
    }, [users, selectedUserIds]);

    const onSaveCopyInUser = React.useCallback(
        (selectedUsersIds: Id[], updateStrategy: UpdateStrategy, accessElements: AccessElements) => {
            if (selectedUser && actionType) {
                copyInUser(selectedUser, selectedUsersIds, updateStrategy, accessElements);
            }
        },
        [actionType, selectedUser, copyInUser]
    );

    const onSettingsClose = React.useCallback(
        (settings: Maybe<Settings>) => {
            setShowSettings(false);
            if (settings) {
                openSettings(settings);
            }
        },
        [openSettings]
    );

    const closeImportModal = React.useCallback(
        (options: { reloadTable: boolean }) => {
            if (options.reloadTable) {
                reload();
            }
            setShowImportModal(false);
        },
        [reload]
    );

    const showImportDialog = React.useCallback((importResult: ImportResult) => {
        setImportResult(importResult);
        setShowImportModal(true);
    }, []);

    const updateAppSettings = React.useCallback(
        (appSettings: AppSettings) => {
            setShowSettings(false);
            setAppSettings(appSettings);
        },
        [setAppSettings]
    );

    React.useEffect(() => {
        compositionRoot.users
            .checkCurrentUserCanAccessSettings()
            .run(setCurrentUserHasAccessToSettings, snackbar.error);
    }, [compositionRoot.users, snackbar.error]);

    const selectedUsers = users && users.length > 0;

    return (
        <React.Fragment>
            {multiSelectorDialogProps && <MultiSelectorDialog {...multiSelectorDialogProps} />}

            {actionType && isActionTypeRisky(actionType) && selectedUsers && (
                <UsersSelectedModal
                    users={users}
                    isOpen={users.length > 0}
                    onSuccess={onSuccessUsersRemove}
                    onCancel={onCleanSelectedUsers}
                    actionType={actionType}
                />
            )}

            {actionType && isActionTypeOrgUnit(actionType) && selectedUsers && (
                <OrgUnitDialogSelector
                    onCancel={onCleanSelectedUsers}
                    onSave={onSaveOrgUnits}
                    title={generateOrgUnitTitle}
                    visible
                    users={users}
                    actionType={actionType}
                />
            )}

            {actionType && isActionTypeCopyInUser(actionType) && selectedUser && allUsers && (
                <CopyInUserDialog
                    user={selectedUser}
                    usersList={allUsers}
                    onCancel={onCleanSelectedUsers}
                    onSave={onSaveCopyInUser}
                    visible
                />
            )}

            {showSettings && currentUserHasAccessToSettings && (
                <SettingsDialogModal onClose={onSettingsClose} onCloseAppSettings={updateAppSettings} />
            )}

            <PatchPaginationTableWrapper
                className={needsPatch ? "patched" : undefined}
                pagination={tableProps.pagination}
            >
                <ObjectsList<User> {...tableProps} columns={columnsToShow}>
                    {children}
                    <div className="user-management-control pagination" style={{ order: 11 }}>
                        {importSettings && mappingColumns && (
                            <ImportExport
                                columns={mappingColumns}
                                filterOptions={{ ...filterOption, onlyUsersOrgUnits, onlyActiveUsers, hideUsers }}
                                onImport={showImportDialog}
                                settings={importSettings}
                            />
                        )}
                    </div>
                </ObjectsList>
            </PatchPaginationTableWrapper>

            {showImportModal && importResult && (
                <ImportTable
                    title={i18n.t("Import")}
                    actionText={i18n.t("Import")}
                    onSave={() => closeImportModal({ reloadTable: true })}
                    onRequestClose={() => closeImportModal({ reloadTable: false })}
                    usersFromFile={importResult.users}
                    columns={importResult.columns}
                    warnings={importResult.warnings}
                />
            )}
        </React.Fragment>
    );
};

export function useUserColumns() {
    const columns = React.useMemo((): TableColumn<User>[] => {
        return [
            { name: "id", sortable: false, text: i18n.t("User ID"), hidden: true },
            { name: "username", sortable: false, text: i18n.t("Username") },
            { name: "firstName", sortable: true, text: i18n.t("First Name") },
            { name: "surname", sortable: true, text: i18n.t("Surname") },
            { name: "email", sortable: true, text: i18n.t("Email") },
            { name: "phoneNumber", text: i18n.t("Phone number") },
            { name: "openId", sortable: false, text: i18n.t("Open ID"), hidden: true },
            { name: "created", sortable: true, text: i18n.t("Created"), hidden: true },
            { name: "lastUpdated", sortable: true, text: i18n.t("Last updated"), hidden: true },
            { name: "apiUrl", sortable: false, text: i18n.t("API URL"), hidden: true },
            {
                name: "userRoles",
                sortable: false,
                text: i18n.t("Roles"),
                getValue: user => buildEllipsizedList(user.userRoles),
                hidden: true,
            },
            {
                name: "userGroups",
                sortable: false,
                text: i18n.t("Groups"),
                getValue: user => buildEllipsizedList(user.userGroups),
                hidden: true,
            },
            {
                name: "organisationUnits",
                sortable: false,
                text: i18n.t("Data capture organisation units"),
                getValue: user => buildEllipsizedList(user.organisationUnits),
            },
            {
                name: "dataViewOrganisationUnits",
                sortable: false,
                text: i18n.t("Data view organisation units"),
                getValue: user => buildEllipsizedList(user.dataViewOrganisationUnits),
            },
            {
                name: "searchOrganisationsUnits",
                sortable: false,
                text: i18n.t("Search organisation units"),
                getValue: user => buildEllipsizedList(user.searchOrganisationsUnits),
            },
            { name: "lastLogin", sortable: false, text: i18n.t("Last login") },
            {
                name: "status",
                sortable: true,
                text: i18n.t("Status"),
            },
            {
                name: "disabled",
                sortable: false,
                text: i18n.t("Disabled"),
                getValue: row => (row.disabled ? <Check /> : undefined),
            },
            {
                name: "createdBy",
                sortable: false,
                text: i18n.t("Created By"),
                getValue: row => row.createdBy?.username || "",
            },
            {
                name: "lastModifiedBy",
                sortable: false,
                text: i18n.t("Last Modified By"),
                getValue: row => row.lastModifiedBy?.username || "",
            },
        ];
    }, []);
    return columns;
}

function generateColumnsFromSettings(options: {
    appSettings: Maybe<AppSettings>;
    columns: TableColumn<User>[];
}): TableColumn<User>[] {
    const { appSettings, columns } = options;
    return _(columns)
        .map(column => {
            const currentColumn = appSettings?.columns.find(c => c.field === column.name);
            if (currentColumn?.value === "disabled") return undefined;

            return {
                ...column,
                hidden: currentColumn?.value !== "visible",
            };
        })
        .compact()
        .value();
}

function isStateActionVisible(action: string) {
    const currentUserHasUpdateAccessOn = checkAccess(["update"]);
    const requiredDisabledValue = action === "enable";

    return (users: User[]) =>
        currentUserHasUpdateAccessOn(users) && _(users).some(user => user.disabled === requiredDisabledValue);
}

function hideUserRolesAndUserGroups(userRolesToHide: Id[], userGroupsToHide: Id[]): (user: User) => User {
    return (user: User) => ({
        ...user,
        userRoles: user.userRoles.filter(role => !userRolesToHide.includes(role.id)),
        userGroups: user.userGroups.filter(group => !userGroupsToHide.includes(group.id)),
    });
}

export type UserActionName =
    | "remove"
    | "disable"
    | "enable"
    | "replicate_template"
    | "replicate_table"
    | "copy_in_user";

export interface UserListTableProps extends Pick<ObjectsTableProps<User>, "loading"> {
    openSettings: (settings: Settings) => void;
    filters: ListFilters;
    canManage: string;
    rootJunction: "AND" | "OR";
    onChangeVisibleColumns: (columns: string[]) => void;
    onChangeSearch: (search: string) => void;
    reloadTableKey: number;
    onAction: (ids: string[], action: UserActionName) => void;
    filterOption: ListOptions;
    usersOrgUnits: boolean;
}

export function buildEllipsizedList(items: NamedRef[], limit = 3) {
    const names = items.map(item => item.name);
    const overflow = items.length - limit;
    const hasOverflow = overflow > 0;

    const buildList = (items: string[]) => items.map((item, idx) => <li key={`org-unit-${idx}`}>{item}</li>);

    return (
        <Tooltip title={buildList(names)} disableHoverListener={!hasOverflow}>
            <ul>
                {buildList(_.take(names, limit))}

                {hasOverflow && <li>{i18n.t("And {{overflow}} more...", { overflow })}</li>}
            </ul>
        </Tooltip>
    );
}

/**
 * Prevent pointless "next" requests when DHIS2 Pagination Bug. Solution: Clamp pagination on the last meaningful page.
 * Subsequent pages return only the "admin" user, so the last meaningful page should have fewer items than the page size.
 * This workaround calculates the total count based on the items returned on the last meaningful page.

 * Note: If the "last page" has the same number of items as the page size, we will not clamp. However, on the next page,
 * since only the "admin" user will be returned, the condition will be met.
 */
function patchPaginatedReponseIfNeeded(needsPatch: boolean, paginatedReponse: PaginatedResponse<User>) {
    const { objects, pager } = paginatedReponse;

    const isLastPage = objects.length < pager.pageSize;
    const clampedPager = { ...pager, total: pager.pageSize * (pager.page - 1) + objects.length };

    return needsPatch && isLastPage ? { objects, pager: clampedPager } : { objects, pager };
}

/**
 * Workaround for DHIS2 Bug: When usersOrgUnits and filters are present, the total count for pagination is not calculated correctly.
 * To address this, we set the total count to Infinity to ensure pagination works correctly, and use CSS to mask the incorrect total count.
 * This approach avoids modifying the ObjectsList component on d2-ui-components, which also relies on TablePagination from material-ui, making this workaround a less invasive solution.
 */
const PatchPaginationTableWrapper = styled.div<{ pagination: Partial<TablePagination> }>`
    ${({ pagination }) => {
        if (!pagination.total || !pagination.pageSize || !pagination.page) return "";
        if (pagination.total < pagination.pageSize * pagination.page) return ""; // Patched after request
        const start = (pagination.page - 1) * pagination.pageSize + 1;
        const end = pagination.pageSize * pagination.page;
        const chars = `${start}-${end}`.length;

        return `
            &.patched
                .MuiTablePagination-root
                p.MuiTypography-root.MuiTablePagination-caption.MuiTypography-body2.MuiTypography-colorInherit:nth-of-type(2):before {
                content: "${start}-${end}";
                display: inline;
                visibility: visible;
            }

            &.patched
                .MuiTablePagination-root
                p.MuiTypography-root.MuiTablePagination-caption.MuiTypography-body2.MuiTypography-colorInherit:nth-of-type(2) {
                visibility: hidden;
                white-space: nowrap;
                width: calc(${chars} * 1ch); /* In this case, I checked that Roboto has same width for all numbers (and ch is '0' char width) */
                height: calc(1em * 1.43); /* 1.43 is the line-height */
                overflow: hidden;
            }`;
    }}
`;
