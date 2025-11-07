import React from "react";
import i18n from "../../../utils/i18n";
import FileSaver from "file-saver";

import { ObjectsList, TableConfig, TablePagination, TableSorting, useObjectsTable } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { Pager } from "../../../domain/entities/PaginatedResponse";
import { buildEllipsizedList } from "../user-list-table/UserListTable";
import { UserGroup } from "../../../domain/entities/UserGroup";
import { Id } from "../../../domain/entities/Ref";
import { UsersFilters, UsersFiltersProps } from "../users-filter/UsersFilters";
import ExportIcon from "@material-ui/icons/ArrowDownward";
import { PopoverList } from "../popover-list/PopoverList";
import { getFilename } from "../../utils/file";

import { GetUsersGroupsOptions } from "../../../domain/repositories/UserGroupRepository";
import { CompositionRoot } from "../../../CompositionRoot";
import { makeStyles } from "@material-ui/core";

function generateTableConfig(): TableConfig<UserGroup> {
    return {
        allowEmptyColumns: false,
        actions: [],
        columns: [
            {
                name: "name",
                text: i18n.t("Name"),
                getValue: userGroup => userGroup.name,
            },
            {
                name: "users",
                text: i18n.t("Users"),
                sortable: false,
                getValue: userGroup => buildEllipsizedList(userGroup.users),
            },
        ],
        initialSorting: { field: "name", order: "asc" },
        paginationOptions: { pageSizeInitialValue: 25, pageSizeOptions: [10, 25, 50] },
    };
}

export const UserGroupTable: React.FC<{}> = React.memo(() => {
    const [selectedUsersIds, setSelectedUsersIds] = React.useState<Id[]>();
    const [excludeUsersOrgUnit, setExcludeUsersOrgUnit] = React.useState(true);
    const { compositionRoot, currentUser } = useAppContext();
    const classes = useStyles();

    const items = React.useMemo(
        () => [
            {
                id: "export_csv",
                label: i18n.t("Export to CSV"),
                icon: <ExportIcon />,
            },
            {
                id: "export_json",
                label: i18n.t("Export to JSON"),
                icon: <ExportIcon />,
            },
        ],
        []
    );

    const config = React.useMemo(() => {
        return generateTableConfig();
    }, []);

    const getRows = React.useCallback(
        (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<UserGroup>
        ): Promise<{ objects: UserGroup[]; pager: Pager }> => {
            return compositionRoot.userGroups
                .get({
                    page: page,
                    pageSize: pageSize,
                    search: search,
                    sorting: { field: sorting.field, order: sorting.order },
                    excludeUsersOutsideOrgUnits: excludeUsersOrgUnit,
                    usersIds: selectedUsersIds,
                    hideUsers: undefined,
                    hideGroups: undefined,
                    user: currentUser,
                })
                .toPromise();
        },
        [compositionRoot.userGroups, selectedUsersIds, currentUser, excludeUsersOrgUnit]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback<UsersFiltersProps["onFilterChange"]>(filters => {
        setSelectedUsersIds(filters.users.length > 0 ? filters.users.map(user => user.value) : undefined);
        setExcludeUsersOrgUnit(filters.excludeOutsideOrgUnit);
    }, []);

    const exportRecords = React.useCallback(
        (action: string) => {
            const search = document.querySelector<HTMLInputElement>("input[type='search']")?.value ?? "";
            getAllUserGroups(compositionRoot, {
                search: search,
                sorting: tableProps.sorting
                    ? { field: tableProps.sorting.field, order: tableProps.sorting.order }
                    : { field: "name", order: "asc" },
                excludeUsersOutsideOrgUnits: true,
                usersIds: selectedUsersIds,
                pageSize: 100,
                hideUsers: undefined,
                hideGroups: undefined,
                user: currentUser,
            }).then(userGroups => {
                const fileName = getFilename({
                    name: "user-groups",
                    format: action === "export_csv" ? "csv" : "json",
                });
                if (action === "export_csv") {
                    const rows = userGroups.map(user => user);
                    buildCsvRow(rows, fileName);
                } else if (action === "export_json") {
                    FileSaver.saveAs(
                        new Blob([JSON.stringify(userGroups, null, 4)], { type: "application/json" }),
                        fileName
                    );
                }
            });
        },
        [compositionRoot, selectedUsersIds, tableProps.sorting, currentUser]
    );

    return (
        <ObjectsList {...tableProps}>
            <UsersFilters
                onFilterChange={updateFilters}
                showUserFilter
                showOrgUnitFilter
                filterUserLabel={i18n.t("Filter users")}
            />
            <div className={classes.popoverContainer}>
                <PopoverList title={i18n.t("Actions")} items={items} onItemClick={exportRecords} />
            </div>
        </ObjectsList>
    );
});

const useStyles = makeStyles({
    popoverContainer: {
        order: 100,
    },
});

const getAllUserGroups = async (
    compositionRoot: CompositionRoot,
    baseParams: Omit<GetUsersGroupsOptions, "page">,
    currentPage = 1
): Promise<UserGroup[]> => {
    const response = await compositionRoot.userGroups
        .get({
            ...baseParams,
            page: currentPage,
        })
        .toPromise();

    const { objects, pager } = response;

    if (pager.page >= pager.pageCount) {
        return objects;
    }

    const nextPageObjects = await getAllUserGroups(compositionRoot, baseParams, currentPage + 1);

    return [...objects, ...nextPageObjects];
};

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
