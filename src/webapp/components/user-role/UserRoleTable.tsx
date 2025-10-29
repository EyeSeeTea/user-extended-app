import React from "react";
import i18n from "../../../utils/i18n";
import { UserRole } from "../../../domain/entities/UserRole";
import { ObjectsList, TableConfig, TablePagination, TableSorting, useObjectsTable } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { Pager } from "../../../domain/entities/PaginatedResponse";
import { buildEllipsizedList } from "../user-list-table/UserListTable";
import { UsersFilters, UsersFiltersProps } from "../users-filter/UsersFilters";

function generateTableConfig(): TableConfig<UserRole> {
    return {
        actions: [],
        columns: [
            {
                name: "name",
                text: i18n.t("Name"),
                getValue: userRole => userRole.name,
            },
            {
                name: "description",
                text: i18n.t("Description"),
            },
            {
                name: "users",
                text: i18n.t("Users"),
                sortable: false,
                getValue: userRole => buildEllipsizedList(userRole.users),
            },
        ],
        initialSorting: { field: "name", order: "asc" },
        paginationOptions: { pageSizeInitialValue: 25, pageSizeOptions: [10, 25, 50] },
    };
}

export const UserRoleTable: React.FC<{}> = React.memo(() => {
    const { compositionRoot, currentUser } = useAppContext();
    const [excludeUsersOrgUnit, setExcludeUsersOrgUnit] = React.useState(true);

    const config = React.useMemo(() => {
        return generateTableConfig();
    }, []);

    const getRows = React.useCallback(
        (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<UserRole>
        ): Promise<{ objects: UserRole[]; pager: Pager }> => {
            return compositionRoot.userRoles
                .get({
                    page: page,
                    pageSize: pageSize,
                    search: search,
                    sorting: { field: sorting.field, order: sorting.order },
                    excludeUsersOutsideOrgUnits: excludeUsersOrgUnit,
                    user: currentUser,
                })
                .toPromise();
        },
        [compositionRoot.userRoles, currentUser, excludeUsersOrgUnit]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback<UsersFiltersProps["onFilterChange"]>(filters => {
        setExcludeUsersOrgUnit(filters.excludeOutsideOrgUnit);
    }, []);

    return (
        <ObjectsList {...tableProps}>
            <UsersFilters onFilterChange={updateFilters} showFilterModal />
        </ObjectsList>
    );
});
