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
import { createPagination, filterAndSortItemWithUsers } from "../../utils/table";

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
    const defaultExcludeOrgUnit = appSettings.uiUserRoleActionsAccess.filterUsersInOrgUnit.defaultValue ?? true;
    const defaultFilterEmptyUsers =
        appSettings.uiUserRoleActionsAccess.filterHideNotApplicableUserRoles.defaultValue ?? true;
    const { compositionRoot, currentUser } = useAppContext();
    const [userIds, setUserIds] = React.useState<Id[]>();
    const [excludeUsersOrgUnit, setExcludeUsersOrgUnit] = React.useState(defaultExcludeOrgUnit);
    const [filterEmptyUsers, setFilterEmptyUsers] = React.useState(defaultFilterEmptyUsers);
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

            const filteredUserRoles = filterAndSortItemWithUsers({
                items: userRoles,
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
                    emptyUsersLabel={i18n.t("Hide not applicable user roles")}
                    showEmptyUsers={
                        isAdmin || appSettings.uiUserRoleActionsAccess.filterHideNotApplicableUserRoles.visible
                    }
                    defaultExcludeOrgUnit={defaultExcludeOrgUnit}
                    defaultFilterEmptyUsers={defaultFilterEmptyUsers}
                />
            )}
        </ObjectsList>
    );
});
