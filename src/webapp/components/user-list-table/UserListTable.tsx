import styled from "styled-components";
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
import { Button, Icon, Tooltip } from "@material-ui/core";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import _ from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { User } from "../../../domain/entities/User";
import { ListFilters, UpdateStrategy, AccessElements, ListOptions } from "../../../domain/repositories/UserRepository";
import { isSuperAdmin } from "../../../domain/entities/UserProps";
import { SaveUserOrgUnitOptions } from "../../../domain/usecases/SaveUserOrgUnitUseCase";
import i18n from "../../../utils/i18n";
import { Maybe } from "../../../types/utils";
import { useAppContext } from "../../contexts/app-context";
import { useReload } from "../../hooks/useReload";
import {
    useColumnsPreferences,
    useCopyInUser,
    useGetAllUsers,
    useGetUsersByIds,
    useSaveUsersOrgUnits,
} from "../../hooks/userHooks";
import { MultiSelectorDialog, MultiSelectorDialogProps } from "../multi-selector-dialog/MultiSelectorDialog";
import { OrgUnitDialogSelector } from "../orgunit-dialog-selector/OrgUnitDialogSelector";
import { CopyInUserDialog } from "../copy-in-user-dialog/CopyInUserDialog";
import {
    ActionType,
    OrgUnitActionType,
    formatUserList,
    getFirstThreeUserNames,
    UsersSelectedModal,
    RiskyActionType,
} from "../users-selected-modal/UsersSelectedModal";
import { useImportSettings } from "../settings-dialog-modal/SettingsDialogModal";
import Settings from "../../../legacy/models/settings";
import { ImportExport, ImportResult } from "../import-export/ImportExport";
import { ColumnMappingKeys } from "../../../domain/usecases/ExportUsersUseCase";
import { ImportTable } from "../import-export/ImportTable";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { PaginatedResponse } from "../../../domain/entities/PaginatedResponse";
import { UserAction } from "../../../domain/entities/UserAction";
import { UsersSetPasswordModal } from "../users-selected-modal/UsersSetPasswordModal";
import { useUserColumns } from "./userColumns";
import { getUserActionLabel } from "./userListTableHelpers";
import { useActionsAccessibleToCurrentUser } from "./useActionsAccessibleToCurrentUser";
import { Column } from "../../../domain/entities/UserColumn";

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
    onChangeVisibleColumns,
    onChangeSearch,
    filters,
    canManage,
    rootJunction,
    children,
    reloadTableKey,
    onAction,
    filterOption,
    onlyUsersOrgUnits,
}) => {
    const { compositionRoot, currentUser } = useAppContext();
    const [reloadKey, reload] = useReload();
    const [columnsKey, reloadColumns] = useReload();

    const [multiSelectorDialogProps, openMultiSelectorDialog] = useState<MultiSelectorDialogProps>();
    const [mappingColumns, setMappingColumns] = useState<ColumnMappingKeys[]>();
    const [selectedUserIds, setSelectedUserIds] = useState<Id[]>([]);
    const [actionType, setActionType] = useState<ActionType>();
    const [showImportModal, setShowImportModal] = React.useState(false);
    const [importResult, setImportResult] = React.useState<ImportResult>();

    const { importSettings } = useImportSettings();

    const snackbar = useSnackbar();
    const navigate = useNavigate();
    const userColumns = useUserColumns();

    const { users, setUsers } = useGetUsersByIds(selectedUserIds);
    const { users: allUsers } = useGetAllUsers(onlyUsersOrgUnits);
    const { appSettings } = useAppSettingsContext();
    const {
        showOnlyActiveUsers: onlyActiveUsers,
        hide: { users: hideUsers },
    } = appSettings;
    const { columnsPreferences } = useColumnsPreferences({
        columnsKey,
        appSettings,
        user: currentUser,
        onChangeVisibleColumns,
    });

    const currentUserAccessibleActions = useActionsAccessibleToCurrentUser(currentUser, appSettings.actionsAccess);

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
            if (!columnsPreferences || !columns.length) return;

            const indexes = _(columns)
                .map((columnName, idx) => [columnName, idx] as [string, number])
                .fromPairs()
                .value();

            const columnsToSave = columnsPreferences.map(col => {
                // TODO: improve types to use the same one from entity UserColumn
                // @ts-expect-error
                const isVisible = columns.includes(col.fieldName);
                return Column.build({
                    fieldName: col.fieldName,
                    state: isVisible ? "selected" : "unselected",
                    position: isVisible ? indexes[col.fieldName] ?? 0 : -1,
                }).getOrThrow();
            });

            onChangeVisibleColumns(columnsToSave.map(col => col.fieldName));
            setMappingColumns(columns);

            compositionRoot.users.saveColumns(columnsToSave).run(
                () => {},
                error => snackbar.error(error)
            );
        },
        [compositionRoot, columnsPreferences, onChangeVisibleColumns, snackbar]
    );

    //TODO: start moving to useHook
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
                },
                {
                    name: UserAction.SET_PASSWORD,
                    text: getUserActionLabel(UserAction.SET_PASSWORD),
                    icon: <Icon>enhanced_encryption</Icon>,
                    multiple: false,
                    onClick: (users: string[]) => {
                        setSelectedUserIds(users);
                        setActionType("set_password");
                    },
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
                },
                {
                    name: UserAction.REPLICATE_USER_FROM_TEMPLATE,
                    text: getUserActionLabel(UserAction.REPLICATE_USER_FROM_TEMPLATE),
                    icon: <FileCopyIcon />,
                    multiple: false,
                    onClick: (users: string[]) => onAction(users, "replicate_template"),
                },
                {
                    name: UserAction.REPLICATE_USER_FROM_TABLE,
                    text: getUserActionLabel(UserAction.REPLICATE_USER_FROM_TABLE),
                    icon: <Icon>toc</Icon>,
                    multiple: false,
                    onClick: (users: string[]) => onAction(users, "replicate_table"),
                },
            ].map(action => ({
                ...action,
                isActive: (users: User[]) => currentUserAccessibleActions[action.name](users),
            })),
        [currentUserAccessibleActions, editUsers, onAction, reload]
    );

    const resetColumnsToDefault = React.useCallback(() => {
        return compositionRoot.users.resetColumns(appSettings).run(
            columnsResponse => {
                onChangeVisibleColumns(columnsResponse);
                reloadColumns();
                snackbar.success(i18n.t("Column settings have been successfully reset."));
            },
            error => snackbar.error(error)
        );
    }, [compositionRoot, appSettings, snackbar, onChangeVisibleColumns, reloadColumns]);

    const columnsTable = React.useMemo(() => {
        return _(columnsPreferences)
            .map((columnPreference): Maybe<TableColumn<User>> => {
                const columnDefinition = userColumns.find(col => col.name === columnPreference.fieldName);
                if (!columnDefinition) return undefined;

                return {
                    ...columnDefinition,
                    disabled: isSuperAdmin(currentUser) ? false : columnPreference.state === "selected-disabled",
                    hidden: columnPreference.state === "unselected",
                };
            })
            .compact()
            .value();
    }, [columnsPreferences, userColumns, currentUser]);

    const baseConfig = useMemo((): TableConfig<User> => {
        return {
            allowEmptyColumns: false,
            childrenTransfer: (
                <ResetColumnsContainer>
                    <Button variant="contained" color="primary" onClick={resetColumnsToDefault}>
                        {i18n.t("Reset Columns")}
                    </Button>
                </ResetColumnsContainer>
            ),
            columns: columnsTable,
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
    }, [actions, onReorderColumns, resetColumnsToDefault, columnsTable]);

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
                    .listAllIdentifiers({
                        search,
                        sorting,
                        filters,
                        canManage,
                        rootJunction,
                        onlyUsersOrgUnits,
                        onlyActiveUsers: onlyActiveUsers,
                        hideUsers: appSettings.hide.users,
                    })
                    .toPromise()
                    .then(userIdentifiers => userIdentifiers.map(user => user.id));

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
                    onlyUsersOrgUnits,
                    onlyActiveUsers: onlyActiveUsers,
                    hideUsers: appSettings.hide.users,
                })
                .map(({ objects, pager }) => ({
                    pager,
                    objects: isSuperAdmin(currentUser)
                        ? objects
                        : objects.map(
                              hideUserRolesAndUserGroups(appSettings.hide.userRoles, appSettings.hide.userGroups)
                          ),
                }))
                .map(paginatedReponse => patchPaginatedReponseIfNeeded(false, paginatedReponse))
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
            currentUser,
        ]
    );

    const refreshAllIds = useCallback(
        (search: string, sorting: TableSorting<User>): Promise<string[]> => {
            return compositionRoot.users
                .listAllIdentifiers({
                    search,
                    sorting,
                    filters,
                    canManage,
                    rootJunction,
                    onlyUsersOrgUnits,
                    onlyActiveUsers: onlyActiveUsers,
                    hideUsers: appSettings.hide.users,
                })
                .toPromise()
                .then(userIdentifiers => userIdentifiers.map(user => user.id));
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

    const onSuccessUsersAction = () => {
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
            remainingCount: formatUserList(users),
            nsSeparator: false,
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

    const selectedUsers = users && users.length > 0;

    return (
        <React.Fragment>
            {multiSelectorDialogProps && <MultiSelectorDialog {...multiSelectorDialogProps} />}

            {actionType && actionType === "set_password" && selectedUsers && (
                <UsersSetPasswordModal
                    actionType={actionType}
                    users={users}
                    isOpen={users.length === 1}
                    onSuccess={onSuccessUsersAction}
                    onCancel={onCleanSelectedUsers}
                />
            )}

            {actionType && isActionTypeRisky(actionType) && selectedUsers && (
                <UsersSelectedModal
                    users={users}
                    isOpen={users.length > 0}
                    onSuccess={onSuccessUsersAction}
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

            <PatchPaginationTableWrapper pagination={tableProps.pagination}>
                <ObjectsList<User> {...tableProps}>
                    {children}
                    <div className="user-management-control pagination" style={{ order: 11 }}>
                        {importSettings && mappingColumns && (
                            <ImportExport
                                appSettings={appSettings}
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
                    onlyUsersOrgUnits={onlyUsersOrgUnits}
                />
            )}
        </React.Fragment>
    );
};

function hideUserRolesAndUserGroups(userRolesToHide: Id[], userGroupsToHide: Id[]): (user: User) => User {
    return (user: User) =>
        User.createExisted({
            ...user,
            userRoles: user.userRoles.filter(role => !userRolesToHide.includes(role.id)),
            userGroups: user.userGroups.filter(group => !userGroupsToHide.includes(group.id)),
        }).getOrThrow();
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
    onlyUsersOrgUnits: boolean;
}

//FIMXE: move to another file
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

export const ResetColumnsContainer = styled.div`
    padding-block-start: 0.5em;
`;
