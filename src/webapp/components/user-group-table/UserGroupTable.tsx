import _ from "lodash";
import React from "react";
import i18n from "../../../utils/i18n";
import FileSaver from "file-saver";

import {
    ObjectsList,
    TableColumn,
    TableConfig,
    TablePagination,
    TableSorting,
    useObjectsTable,
} from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { Pager } from "../../../domain/entities/PaginatedResponse";
import { buildEllipsizedList } from "../user-list-table/UserListTable";
import { UserGroup } from "../../../domain/entities/UserGroup";
import { Id } from "../../../domain/entities/Ref";
import { UsersFilters, UsersFiltersProps } from "../users-filter/UsersFilters";
import ExportIcon from "@material-ui/icons/ArrowDownward";
import { PopoverList } from "../popover-list/PopoverList";
import { getFilename } from "../../utils/file";

import { makeStyles } from "@material-ui/core";
import { isSuperAdmin, UserProps } from "../../../domain/entities/UserProps";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { GroupColumnSetting } from "../../../domain/entities/GroupColumn";
import { useUserGroups } from "./useUserGroups";
import { createPagination, filterAndSortItemWithUsers } from "../../utils/table";

function generateTableConfig(options: {
    currentPageSize: number;
    columnsPreference: GroupColumnSetting[];
    currentUser: UserProps;
}): TableConfig<UserGroup> {
    const { currentPageSize, columnsPreference, currentUser } = options;

    const allColumns: TableColumn<UserGroup>[] = columnsPreference.map(columnSetting => {
        return {
            name: columnSetting.fieldName,
            text: _.capitalize(columnSetting.fieldName),
            getValue: (userGroup: UserGroup) => {
                if (columnSetting.fieldName === "users") return buildEllipsizedList(userGroup.users);
                return userGroup[columnSetting.fieldName];
            },
            sortable: columnSetting.fieldName !== "users",
            hidden: columnSetting.state === "unselected",
            disabled: isSuperAdmin(currentUser) ? false : columnSetting.state === "selected-disabled",
        };
    });

    return {
        actions: [],
        columns: allColumns,
        initialSorting: { field: "name", order: "asc" },
        paginationOptions: { pageSizeInitialValue: currentPageSize, pageSizeOptions: [10, 25, 50] },
    };
}

type UserGroupTableProps = {
    appSettings: AppSettings;
};

export const UserGroupTable: React.FC<UserGroupTableProps> = React.memo(props => {
    const { appSettings } = props;
    const defaultExcludeOrgUnit = appSettings.uiUserGroupActionsAccess.filterUsersInOrgUnit.defaultValue ?? true;
    const defaultFilterEmptyUsers =
        appSettings.uiUserGroupActionsAccess.filterHideNotApplicableUserGroups.defaultValue ?? true;
    const [currentPageSize, setCurrentPageSize] = React.useState(25);
    const [selectedUsersIds, setSelectedUsersIds] = React.useState<Id[]>();
    const [excludeUsersOrgUnit, setExcludeUsersOrgUnit] = React.useState(defaultExcludeOrgUnit);
    const [filterEmptyUsers, setFilterEmptyUsers] = React.useState(defaultFilterEmptyUsers);
    const { compositionRoot, currentUser } = useAppContext();
    const classes = useStyles();
    const { userGroups } = useUserGroups({ excludeUsersOutsideOrgUnits: excludeUsersOrgUnit, currentUser });
    const isAdmin = isSuperAdmin(currentUser);
    const [columnsPreference, setColumnsPreference] = React.useState<GroupColumnSetting[]>([]);

    React.useEffect(() => {
        return compositionRoot.groupColumns.get.execute(currentUser).run(setColumnsPreference, console.error);
    }, [compositionRoot.groupColumns, currentUser, appSettings]);

    const items = React.useMemo(
        () =>
            [
                {
                    id: "exportCsv" as const,
                    label: i18n.t("Export to CSV"),
                    icon: <ExportIcon />,
                },
                {
                    id: "exportJson" as const,
                    label: i18n.t("Export to JSON"),
                    icon: <ExportIcon />,
                },
            ].filter(item => isAdmin || appSettings.uiUserGroupActionsAccess[item.id].visible),
        [isAdmin, appSettings.uiUserGroupActionsAccess]
    );

    const config = React.useMemo(() => {
        return generateTableConfig({ currentPageSize, columnsPreference, currentUser });
    }, [currentPageSize, columnsPreference, currentUser]);

    const getRows = React.useCallback(
        (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<UserGroup>
        ): Promise<{ objects: UserGroup[]; pager: Pager }> => {
            setCurrentPageSize(pageSize);

            const filteredUserGroups = filterAndSortItemWithUsers({
                items: userGroups,
                search: search,
                sort: sorting.order,
                filterEmptyUsers: filterEmptyUsers,
                selectedUsersIds: selectedUsersIds,
            });

            return Promise.resolve(createPagination(filteredUserGroups, page, pageSize));
        },
        [userGroups, filterEmptyUsers, selectedUsersIds]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback<UsersFiltersProps["onFilterChange"]>(filters => {
        setSelectedUsersIds(filters.users.length > 0 ? filters.users.map(user => user.value) : undefined);
        setExcludeUsersOrgUnit(filters.excludeOutsideOrgUnit);
        setFilterEmptyUsers(filters.filterEmptyUsers);
    }, []);

    const exportRecords = React.useCallback(
        (action: string) => {
            const fileName = getFilename({
                name: "user-groups",
                format: action === "exportCsv" ? "csv" : "json",
            });
            if (action === "exportCsv") {
                const rows = tableProps.rows.map(user => user);
                buildCsvRow(rows, fileName);
            } else if (action === "exportJson") {
                FileSaver.saveAs(
                    new Blob([JSON.stringify(tableProps.rows, null, 4)], { type: "application/json" }),
                    fileName
                );
            }
        },
        [tableProps.rows]
    );

    const someFilterEnabled =
        appSettings.uiUserGroupActionsAccess.filterUsers.visible ||
        appSettings.uiUserGroupActionsAccess.filterUsersInOrgUnit.visible ||
        appSettings.uiUserGroupActionsAccess.filterHideNotApplicableUserGroups.visible;

    return (
        <ObjectsList {...tableProps}>
            {(isAdmin || someFilterEnabled) && (
                <UsersFilters
                    onFilterChange={updateFilters}
                    showUserFilter={isAdmin || appSettings.uiUserGroupActionsAccess.filterUsers.visible}
                    showOrgUnitFilter={isAdmin || appSettings.uiUserGroupActionsAccess.filterUsersInOrgUnit.visible}
                    filterUserLabel={i18n.t("Filter users")}
                    emptyUsersLabel={i18n.t("Hide not applicable user groups")}
                    showEmptyUsers={
                        isAdmin || appSettings.uiUserGroupActionsAccess.filterHideNotApplicableUserGroups.visible
                    }
                    defaultExcludeOrgUnit={defaultExcludeOrgUnit}
                    defaultFilterEmptyUsers={defaultFilterEmptyUsers}
                />
            )}
            {items.length > 0 && (
                <div className={classes.popoverContainer}>
                    <PopoverList title={i18n.t("Actions")} items={items} onItemClick={exportRecords} />
                </div>
            )}
        </ObjectsList>
    );
});

const useStyles = makeStyles({
    popoverContainer: {
        order: 100,
    },
});

function buildCsvRow(rows: UserGroup[], fileName: string): void {
    FileSaver.saveAs(
        new Blob(
            [
                [["id", "name", "users"], ...rows.map(ug => [ug.id, ug.name, ug.users.map(u => u.name).join("|")])]
                    .map(e => e.join(","))
                    .join("\n"),
            ],
            { type: "text/csv;charset=utf-8" }
        ),
        fileName
    );
}
