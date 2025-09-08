export enum UserAction {
    DETAILS = "details",
    EDIT = "edit",
    COPY_IN_USER = "copy_in_user",
    ASSIGN_TO_ORG_UNITS_CAPTURE = "assign_to_org_units_capture",
    ASSIGN_TO_ORG_UNITS_OUTPUT = "assign_to_org_units_output",
    ASSIGN_TO_ORG_UNITS_SEARCH = "assign_to_org_units_search",
    ASSIGN_ROLES = "assign_roles",
    ASSIGN_GROUPS = "assign_groups",
    ENABLE = "enable",
    DISABLE = "disable",
    RESET_PASSWORD = "reset_password",
    SET_PASSWORD = "set_password",
    REMOVE = "remove",
    REPLICATE_USER_FROM_TEMPLATE = "replicate_user_from_template",
    REPLICATE_USER_FROM_TABLE = "replicate_user_from_table",
}

export const userActions = Object.values(UserAction);
