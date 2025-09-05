import React from "react";
import { TableColumn } from "@eyeseetea/d2-ui-components";
import { Check } from "@material-ui/icons";
import { User } from "../../../domain/entities/User";
import { buildEllipsizedList } from "./UserListTable";
import { ColumnName, getDefaultUserColumns } from "../../../domain/entities/Column";

export function useUserColumns(): TableColumn<User>[] {
    const columns = React.useMemo(() => {
        const columnsWithValues = getDefaultUserColumns();
        return columnsWithValues.map(column => ({
            ...column,
            getValue: getValue(column.name),
        }));
    }, []);
    return columns;
}

function getValue(columnName: ColumnName) {
    switch (columnName) {
        case ColumnName.USER_ROLES:
        case ColumnName.USER_GROUPS:
        case ColumnName.ORGANISATION_UNITS:
        case ColumnName.DATA_VIEW_ORGANISATION_UNITS:
        case ColumnName.SEARCH_ORGANISATIONS_UNITS:
            return (user: User) => buildEllipsizedList(user[columnName]);
        case ColumnName.LAST_LOGIN:
            return (user: User) => (user.disabled ? <Check /> : undefined);
        case ColumnName.CREATED_BY:
            return (user: User) => user.createdBy?.username || "";
        case ColumnName.LAST_MODIFIED_BY:
            return (user: User) => user.lastModifiedBy?.username || "";
        default:
            return undefined;
    }
}
