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

function generateTableConfig(roleColumns: RoleColumnSetting[], currentUser: UserProps): TableConfig<UserRole> {
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
        paginationOptions: { pageSizeInitialValue: 25, pageSizeOptions: [10, 25, 50] },
    };
}

export const UserRoleTable: React.FC<{}> = React.memo(() => {
    const { compositionRoot, currentUser } = useAppContext();
    const [userIds, setUserIds] = React.useState<Id[]>();
    const [excludeUsersOrgUnit, setExcludeUsersOrgUnit] = React.useState(true);
    const [columnsPreference, setColumnsPreference] = React.useState<RoleColumnSetting[]>([]);

    React.useEffect(() => {
        return compositionRoot.roleColumns.get.execute(currentUser).run(setColumnsPreference, console.error);
    }, [compositionRoot.roleColumns, currentUser]);

    const config = React.useMemo(() => {
        return generateTableConfig(columnsPreference, currentUser);
    }, [columnsPreference, currentUser]);

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
                    userIds: userIds,
                })
                .toPromise();
        },
        [compositionRoot.userRoles, currentUser, excludeUsersOrgUnit, userIds]
    );

    const tableProps = useObjectsTable(config, getRows);

    const updateFilters = React.useCallback<UsersFiltersProps["onFilterChange"]>(filters => {
        setExcludeUsersOrgUnit(filters.excludeOutsideOrgUnit);
        setUserIds(filters.users.map(user => user.value));
    }, []);

    return (
        <ObjectsList {...tableProps}>
            <UsersFilters
                onFilterChange={updateFilters}
                showOrgUnitFilter
                showUserFilter
                filterUserLabel={i18n.t("Filter users")}
            />
        </ObjectsList>
    );
});
