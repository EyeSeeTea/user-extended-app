import _ from "lodash";
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
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";
import { buildEllipsizedList } from "../user-list-table/UserListTable";
import { FilteredUser } from "../users-filter/UsersFilters";
import { Id } from "../../../domain/entities/Ref";
import { Maybe } from "../../../types/utils";
import { DashboardFilters } from "./DashboardFilters";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { isSuperAdmin } from "../../../domain/entities/UserProps";

type DashboardTableProps = {
    appSettings: AppSettings;
};

function generateTableConfig(): TableConfig<Dashboard> {
    return {
        allowEmptyColumns: false,
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

export const DashboardTable: React.FC<DashboardTableProps> = React.memo(props => {
    const { appSettings } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const [filters, setFilters] = React.useState<{
        ownerUsersIds?: Id[];
        userIds?: Id[];
        excludeUsersOutsideOrgUnits: boolean;
    }>({
        ownerUsersIds: undefined,
        userIds: undefined,
        excludeUsersOutsideOrgUnits: true,
    });
    const [dashboards, setDashboards] = React.useState<Dashboard[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setLoading(true);
        return compositionRoot.dashboards.get
            .execute({ excludeUsersOutsideOrgUnits: filters.excludeUsersOutsideOrgUnits, user: currentUser })
            .run(
                dashboards => {
                    setLoading(false);
                    setDashboards(dashboards);
                },
                error => {
                    console.error(error);
                    setLoading(false);
                }
            );
    }, [currentUser, compositionRoot.dashboards.get, filters.excludeUsersOutsideOrgUnits]);

    const config = React.useMemo(() => {
        return generateTableConfig();
    }, []);

    const getRows = React.useCallback(
        (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<Dashboard>
        ): Promise<{ objects: Dashboard[]; pager: Pager }> => {
            const filteredDashboards = filterAndSortDashboards(
                dashboards,
                search,
                filters.ownerUsersIds,
                filters.userIds,
                sorting.field,
                sorting.order
            );

            const pager: Pager = {
                page: page,
                pageCount: Math.ceil(filteredDashboards.length / pageSize),
                total: filteredDashboards.length,
                pageSize: pageSize,
            };

            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pagedDashboards = filteredDashboards.slice(startIndex, endIndex);

            return Promise.resolve({ objects: pagedDashboards, pager: pager });
        },
        [filters, dashboards]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback(
        (filters: { owners: FilteredUser[]; users: FilteredUser[]; excludeUsersOutsideOrgUnits: boolean }) => {
            setFilters({
                ownerUsersIds: filters.owners.length ? filters.owners.map(user => user.value) : undefined,
                userIds: filters.users.length ? filters.users.map(user => user.value) : undefined,
                excludeUsersOutsideOrgUnits: filters.excludeUsersOutsideOrgUnits,
            });
        },
        []
    );

    const dashboardOwners = React.useMemo(() => {
        return _(dashboards)
            .map(dashboard => ({ id: dashboard.owner.id, name: dashboard.owner.fullUserName }))
            .uniqBy(dashboard => dashboard.id)
            .value();
    }, [dashboards]);

    const dashboardUsers = React.useMemo(() => {
        return _(dashboards)
            .flatMap(dashboard => dashboard.users.map(user => ({ id: user.id, name: user.fullUserName })))
            .uniqBy(user => user.id)
            .value();
    }, [dashboards]);

    const isAdmin = isSuperAdmin(currentUser);

    const someFilterEnabled =
        appSettings.uiDashboardActionsAccess.filterUsers.visible ||
        appSettings.uiDashboardActionsAccess.filterOwners.visible ||
        appSettings.uiDashboardActionsAccess.filterUsersInOrgUnit.visible;

    return (
        <ObjectsList {...tableProps} loading={loading}>
            {(isAdmin || someFilterEnabled) && (
                <DashboardFilters
                    isAdmin={isAdmin}
                    appSettings={appSettings}
                    onFilterChange={updateFilters}
                    owners={dashboardOwners}
                    users={dashboardUsers}
                />
            )}
        </ObjectsList>
    );
});

export const filterAndSortDashboards = (
    dashboards: Dashboard[],
    search: string,
    owners: Maybe<Id[]>,
    users: Maybe<Id[]>,
    field: keyof Dashboard = "name",
    sort: "asc" | "desc" = "asc"
): Dashboard[] => {
    const filtered = _(dashboards)
        .filter(dashboard => {
            const { name, description, owner, users: dashboardUsers } = dashboard;

            const matchesSearch = search
                ? _.some([name, description], text => text.toLowerCase().includes(search.toLowerCase()))
                : true;

            const matchesOwner = owners && owners.length > 0 ? owners.includes(owner.id) : true;

            const matchesUsers = users && users.length > 0 ? _.some(dashboardUsers, u => users.includes(u.id)) : true;

            return matchesSearch && matchesOwner && matchesUsers;
        })
        .orderBy(dashboard => _.get(dashboard, field), sort)
        .value();

    return filtered;
};
