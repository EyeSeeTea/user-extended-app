export enum UserColumn {
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

export const userColumns = Object.values(UserColumn);
