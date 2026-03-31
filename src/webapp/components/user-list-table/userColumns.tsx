import React from "react";
import { TableColumn } from "@eyeseetea/d2-ui-components";
import { Check } from "@material-ui/icons";
import { User } from "../../../domain/entities/User";
import { buildEllipsizedList } from "./UserListTable";
import { UserColumn } from "../../../domain/entities/UserColumn";
import i18n from "../../../utils/i18n";

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

function getValue(columnName: UserColumn) {
    switch (columnName) {
        // Build ellipsized list
        case UserColumn.USER_ROLES:
        case UserColumn.USER_GROUPS:
        case UserColumn.ORGANISATION_UNITS:
        case UserColumn.DATA_VIEW_ORGANISATION_UNITS:
        case UserColumn.SEARCH_ORGANISATIONS_UNITS:
            return (user: User) => buildEllipsizedList(user[columnName]);

        // Created/modified by fields
        case UserColumn.CREATED_BY:
        case UserColumn.LAST_MODIFIED_BY:
            return (user: User) => user[columnName]?.username || "";

        // Boolean fields with check icon display
        case UserColumn.TWO_FACTOR_ENABLED:
        case UserColumn.DISABLED:
        case UserColumn.EXTERNAL_AUTH:
            return (user: User) => (user[columnName] ? <Check /> : undefined);

        default:
            return undefined; // Will be handled by ObjectsList component
    }
}

type Column = {
    name: UserColumn;
    sortable: boolean;
    text: string;
    hidden: boolean;
};

export function getDefaultUserColumns(): Column[] {
    return [
        { name: UserColumn.ID, sortable: false, text: i18n.t("User ID"), hidden: true },
        { name: UserColumn.USERNAME, sortable: false, text: i18n.t("Username"), hidden: false },
        { name: UserColumn.FIRST_NAME, sortable: true, text: i18n.t("First Name"), hidden: false },
        { name: UserColumn.SURNAME, sortable: true, text: i18n.t("Surname"), hidden: false },
        { name: UserColumn.EMAIL, sortable: true, text: i18n.t("Email"), hidden: false },
        { name: UserColumn.PHONE_NUMBER, sortable: false, text: i18n.t("Phone number"), hidden: false },
        { name: UserColumn.OPEN_ID, sortable: false, text: i18n.t("Open ID"), hidden: true },
        { name: UserColumn.CREATED, sortable: true, text: i18n.t("Created"), hidden: true },
        { name: UserColumn.LAST_UPDATED, sortable: true, text: i18n.t("Last updated"), hidden: true },
        { name: UserColumn.API_URL, sortable: false, text: i18n.t("API URL"), hidden: true },
        { name: UserColumn.USER_ROLES, sortable: false, text: i18n.t("Roles"), hidden: true },
        { name: UserColumn.USER_GROUPS, sortable: false, text: i18n.t("Groups"), hidden: true },
        {
            name: UserColumn.ORGANISATION_UNITS,
            sortable: false,
            text: i18n.t("Data capture organisation units"),
            hidden: false,
        },
        {
            name: UserColumn.DATA_VIEW_ORGANISATION_UNITS,
            sortable: false,
            text: i18n.t("Data view organisation units"),
            hidden: false,
        },
        {
            name: UserColumn.SEARCH_ORGANISATIONS_UNITS,
            sortable: false,
            text: i18n.t("Search organisation units"),
            hidden: false,
        },
        { name: UserColumn.LAST_LOGIN, sortable: false, text: i18n.t("Last login"), hidden: false },
        { name: UserColumn.STATUS, sortable: true, text: i18n.t("Status"), hidden: false },
        { name: UserColumn.DISABLED, sortable: false, text: i18n.t("Disabled"), hidden: false },
        { name: UserColumn.CREATED_BY, sortable: false, text: i18n.t("Created By"), hidden: false },
        { name: UserColumn.LAST_MODIFIED_BY, sortable: false, text: i18n.t("Last Modified By"), hidden: false },
        { name: UserColumn.TWO_FACTOR_ENABLED, sortable: false, text: i18n.t("2FA"), hidden: false },
        { name: UserColumn.EXTERNAL_AUTH, sortable: false, text: i18n.t("External Auth"), hidden: false },
    ];
}
