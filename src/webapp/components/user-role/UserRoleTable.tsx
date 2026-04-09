import _ from "lodash";
import React from "react";
import i18n from "../../../utils/i18n";
import { UserRole } from "../../../domain/entities/UserRole";
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
import { UsersFilters, UsersFiltersProps } from "../users-filter/UsersFilters";
import { Id } from "../../../domain/entities/Ref";
import { RoleColumnSetting } from "../../../domain/entities/RoleColumn";
import { isSuperAdmin, UserProps } from "../../../domain/entities/UserProps";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useUserRoles } from "./useUserRoles";
import { Maybe } from "../../../types/utils";

function generateTableConfig(
    currentPageSize: number,
    roleColumns: RoleColumnSetting[],
    currentUser: UserProps
): TableConfig<UserRole> {
    const allColumns: TableColumn<UserRole>[] = roleColumns.map(columnSetting => {
        return {
            name: columnSetting.fieldName,
            text: _.capitalize(columnSetting.fieldName),
            getValue: (userRole: UserRole) => {
                if (columnSetting.fieldName === "users") return buildEllipsizedList(userRole.users);
                return userRole[columnSetting.fieldName];
            },
            sortable: columnSetting.fieldName !== "users",
            hidden: columnSetting.state === "unselected",
            disabled: isSuperAdmin(currentUser) ? false : columnSetting.state === "selected-disabled",
        };
    });

    return {
        allowEmptyColumns: false,
        actions: [],
        columns: allColumns,
        initialSorting: { field: "name", order: "asc" },
        paginationOptions: { pageSizeInitialValue: currentPageSize, pageSizeOptions: [10, 25, 50] },
    };
}

export const UserRoleTable: React.FC<{ appSettings: AppSettings }> = React.memo(props => {
    const { appSettings } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const [userIds, setUserIds] = React.useState<Id[]>();
    const [excludeUsersOrgUnit, setExcludeUsersOrgUnit] = React.useState(true);
    const [filterEmptyUsers, setFilterEmptyUsers] = React.useState(true);
    const [columnsPreference, setColumnsPreference] = React.useState<RoleColumnSetting[]>([]);
    const { userRoles } = useUserRoles({ excludeUsersOutsideOrgUnits: excludeUsersOrgUnit, currentUser });
    const [currentPageSize, setCurrentPageSize] = React.useState(25);

    React.useEffect(() => {
        return compositionRoot.roleColumns.get.execute(currentUser).run(setColumnsPreference, console.error);
    }, [compositionRoot.roleColumns, currentUser, appSettings]);

    const config = React.useMemo(() => {
        return generateTableConfig(currentPageSize, columnsPreference, currentUser);
    }, [currentPageSize, columnsPreference, currentUser]);

    const getRows = React.useCallback(
        (
            search: string,
            { page, pageSize }: TablePagination,
            sorting: TableSorting<UserRole>
        ): Promise<{ objects: UserRole[]; pager: Pager }> => {
            setCurrentPageSize(pageSize);

            const filteredUserRoles = filterAndSortUserRoles({
                roles: userRoles,
                search: search,
                sort: sorting.order,
                filterEmptyUsers: filterEmptyUsers,
                selectedUsersIds: userIds,
            });

            return Promise.resolve(createPagination(filteredUserRoles, page, pageSize));
        },
        [userRoles, filterEmptyUsers, userIds]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback<UsersFiltersProps["onFilterChange"]>(filters => {
        setExcludeUsersOrgUnit(filters.excludeOutsideOrgUnit);
        setUserIds(filters.users.map(user => user.value));
        setFilterEmptyUsers(filters.filterEmptyUsers);
    }, []);

    const isAdmin = isSuperAdmin(currentUser);

    const someFilterEnabled =
        appSettings.uiUserRoleActionsAccess.filterUsers.visible ||
        appSettings.uiUserRoleActionsAccess.filterUsersInOrgUnit.visible;

    return (
        <ObjectsList {...tableProps}>
            {(isAdmin || someFilterEnabled) && (
                <UsersFilters
                    onFilterChange={updateFilters}
                    showOrgUnitFilter={isAdmin || appSettings.uiUserRoleActionsAccess.filterUsersInOrgUnit.visible}
                    showUserFilter={isAdmin || appSettings.uiUserRoleActionsAccess.filterUsers.visible}
                    filterUserLabel={i18n.t("Filter users")}
                    showEmptyUsers={
                        isAdmin || appSettings.uiUserRoleActionsAccess.filterHideNotApplicableUserRoles.visible
                    }
                />
            )}
        </ObjectsList>
    );
});

export const filterAndSortUserRoles = (options: {
    roles: UserRole[];
    search: string;
    sort: "asc" | "desc";
    filterEmptyUsers: boolean;
    selectedUsersIds: Maybe<Id[]>;
}): UserRole[] => {
    const { roles, search, sort = "asc", filterEmptyUsers, selectedUsersIds } = options;
    const filtered = _(roles)
        .filter(role => {
            const { name, users } = role;

            const matchesSearch = search ? name.toLowerCase().includes(search.toLowerCase()) : true;

            const matchesUsers =
                selectedUsersIds && selectedUsersIds.length > 0
                    ? users.some(user => selectedUsersIds.includes(user.id))
                    : true;

            return matchesSearch && matchesUsers;
        })
        .filter(role => {
            if (!filterEmptyUsers) return true;
            return role.users.length > 0;
        })
        .orderBy(role => role.name, sort)
        .value();

    return filtered;
};

function createPagination<T>(records: T[], page: number, pageSize: number): { objects: T[]; pager: Pager } {
    const pager: Pager = {
        page: page,
        pageCount: Math.ceil(records.length / pageSize),
        total: records.length,
        pageSize: pageSize,
    };

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedRecords = records.slice(startIndex, endIndex);
    return { objects: pagedRecords, pager };
}
