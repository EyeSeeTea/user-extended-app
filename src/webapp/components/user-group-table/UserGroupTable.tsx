import React from "react";
import i18n from "../../../utils/i18n";

import { ObjectsList, TableConfig, TablePagination, TableSorting, useObjectsTable } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { Pager } from "../../../domain/entities/PaginatedResponse";
import { buildEllipsizedList } from "../user-list-table/UserListTable";
import { UserGroup } from "../../../domain/entities/UserGroup";
import { Id } from "../../../domain/entities/Ref";
import { FilteredUser, UsersFilters } from "../users-filter/UsersFilters";

function generateTableConfig(): TableConfig<UserGroup> {
    return {
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
        paginationOptions: { pageSizeInitialValue: 10, pageSizeOptions: [10, 25, 50] },
    };
}

export const UserGroupTable: React.FC<{}> = React.memo(() => {
    const [selectedUsersIds, setSelectedUsersIds] = React.useState<Id[]>();
    const { compositionRoot } = useAppContext();

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
                    excludeUsersOutsideOrgUnits: true,
                    usersIds: selectedUsersIds,
                })
                .toPromise();
        },
        [compositionRoot.userGroups, selectedUsersIds]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback((filters: { users: FilteredUser[] }) => {
        setSelectedUsersIds(filters.users.length > 0 ? filters.users.map(user => user.value) : undefined);
    }, []);

    return (
        <ObjectsList {...tableProps}>
            <UsersFilters onFilterChange={updateFilters} />
        </ObjectsList>
    );
});
