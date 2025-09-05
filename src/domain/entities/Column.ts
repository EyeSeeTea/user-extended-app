import i18n from "../../locales";

export enum ColumnName {
    ID = "id",
    USERNAME = "username",
    FIRST_NAME = "firstName",
    SURNAME = "surname",
    EMAIL = "email",
    PHONE_NUMBER = "phoneNumber",
    OPEN_ID = "openId",
    CREATED = "created",
    LAST_UPDATED = "lastUpdated",
    API_URL = "apiUrl",
    USER_ROLES = "userRoles",
    USER_GROUPS = "userGroups",
    ORGANISATION_UNITS = "organisationUnits",
    DATA_VIEW_ORGANISATION_UNITS = "dataViewOrganisationUnits",
    SEARCH_ORGANISATIONS_UNITS = "searchOrganisationsUnits",
    LAST_LOGIN = "lastLogin",
    STATUS = "status",
    DISABLED = "disabled",
    CREATED_BY = "createdBy",
    LAST_MODIFIED_BY = "lastModifiedBy",
}

type Column = {
    name: ColumnName;
    sortable: boolean;
    text: string;
    hidden: boolean;
};

// Note: maintain in function in order to allow i18n to be instantiated
// FIXME: sortable is a view concern, this is view model.
export function getDefaultUserColumns(): Column[] {
    return [
        { name: ColumnName.ID, sortable: false, text: i18n.t("User ID"), hidden: true },
        { name: ColumnName.USERNAME, sortable: false, text: i18n.t("Username"), hidden: false },
        { name: ColumnName.FIRST_NAME, sortable: true, text: i18n.t("First Name"), hidden: false },
        { name: ColumnName.SURNAME, sortable: true, text: i18n.t("Surname"), hidden: false },
        { name: ColumnName.EMAIL, sortable: true, text: i18n.t("Email"), hidden: false },
        { name: ColumnName.PHONE_NUMBER, sortable: false, text: i18n.t("Phone number"), hidden: false },
        { name: ColumnName.OPEN_ID, sortable: false, text: i18n.t("Open ID"), hidden: true },
        { name: ColumnName.CREATED, sortable: true, text: i18n.t("Created"), hidden: true },
        { name: ColumnName.LAST_UPDATED, sortable: true, text: i18n.t("Last updated"), hidden: true },
        { name: ColumnName.API_URL, sortable: false, text: i18n.t("API URL"), hidden: true },
        { name: ColumnName.USER_ROLES, sortable: false, text: i18n.t("Roles"), hidden: true },
        { name: ColumnName.USER_GROUPS, sortable: false, text: i18n.t("Groups"), hidden: true },
        {
            name: ColumnName.ORGANISATION_UNITS,
            sortable: false,
            text: i18n.t("Data capture organisation units"),
            hidden: false,
        },
        {
            name: ColumnName.DATA_VIEW_ORGANISATION_UNITS,
            sortable: false,
            text: i18n.t("Data view organisation units"),
            hidden: false,
        },
        {
            name: ColumnName.SEARCH_ORGANISATIONS_UNITS,
            sortable: false,
            text: i18n.t("Search organisation units"),
            hidden: false,
        },
        { name: ColumnName.LAST_LOGIN, sortable: false, text: i18n.t("Last login"), hidden: false },
        { name: ColumnName.STATUS, sortable: true, text: i18n.t("Status"), hidden: false },
        { name: ColumnName.DISABLED, sortable: false, text: i18n.t("Disabled"), hidden: false },
        { name: ColumnName.CREATED_BY, sortable: false, text: i18n.t("Created By"), hidden: false },
        { name: ColumnName.LAST_MODIFIED_BY, sortable: false, text: i18n.t("Last Modified By"), hidden: false },
    ];
}
