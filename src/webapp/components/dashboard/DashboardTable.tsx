import {
    ObjectsList,
    Pager,
    TableConfig,
    TablePagination,
    TableSorting,
    useObjectsTable,
} from "@eyeseetea/d2-ui-components";
import React from "react";
import { Dashboard } from "../../../domain/entities/Dashboard";
import { GetDashboardOptions } from "../../../domain/repositories/DashboardRepository";
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";
import { buildEllipsizedList } from "../user-list-table/UserListTable";
import { FilteredUser, UsersFilters } from "../users-filter/UsersFilters";

type DashboardTableProps = {};

function generateTableConfig(): TableConfig<Dashboard> {
    return {
        actions: [],
        columns: [
            {
                name: "name",
                text: i18n.t("Name"),
                getValue: dashboard => dashboard.name,
            },
            {
                name: "description",
                text: i18n.t("Description"),
            },
            {
                name: "owner",
                text: i18n.t("Owner"),
                sortable: false,
            },
            {
                name: "users",
                text: i18n.t("Users"),
                sortable: false,
                getValue: dashboard => buildEllipsizedList(dashboard.users),
            },
        ],
        initialSorting: { field: "name", order: "asc" },
        paginationOptions: { pageSizeInitialValue: 25, pageSizeOptions: [10, 25, 50] },
    };
}

export const DashboardTable: React.FC<DashboardTableProps> = React.memo(() => {
    const { compositionRoot, currentUser } = useAppContext();
    const [filters, setFilters] = React.useState<GetDashboardOptions["filters"]>({ ownerUsersIds: undefined });

    const config = React.useMemo(() => {
        return generateTableConfig();
    }, []);

    const getRows = React.useCallback(
        (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<Dashboard>
        ): Promise<{ objects: Dashboard[]; pager: Pager }> => {
            return compositionRoot.dashboards.get
                .execute({
                    page: page,
                    pageSize: pageSize,
                    search: search,
                    filters: { ownerUsersIds: filters.ownerUsersIds },
                    sorting: { field: sorting.field, order: sorting.order },
                    hideUsers: undefined,
                    hideGroups: undefined,
                    user: currentUser,
                })
                .toPromise();
        },
        [compositionRoot.dashboards.get, filters, currentUser]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback((filters: { owners: FilteredUser[] }) => {
        setFilters({ ownerUsersIds: filters.owners.length ? filters.owners.map(user => user.value) : undefined });
    }, []);

    return (
        <ObjectsList {...tableProps}>
            <UsersFilters showOwnerFilter onFilterChange={updateFilters} />
        </ObjectsList>
    );
});
