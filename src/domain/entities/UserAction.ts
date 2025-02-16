import i18n from "../../locales";

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
    REMOVE = "remove",
    REPLICATE_USER_FROM_TEMPLATE = "replicate_user_from_template",
    REPLICATE_USER_FROM_TABLE = "replicate_user_from_table",
}

export function getUserActioni18nKeyLabel(action: UserAction): string {
    switch (action) {
        case UserAction.DETAILS:
            return "Details";
        case UserAction.EDIT:
            return "Edit";
        case UserAction.COPY_IN_USER:
            return "Copy in user";
        case UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE:
            return "Assign to data capture organisation units";
        case UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT:
            return "Assign to data view organisation units";
        case UserAction.ASSIGN_TO_ORG_UNITS_SEARCH:
            return "Assign to search organisation units";
        case UserAction.ASSIGN_ROLES:
            return "Assign roles";
        case UserAction.ASSIGN_GROUPS:
            return "Assign groups";
        case UserAction.ENABLE:
            return "Enable";
        case UserAction.DISABLE:
            return "Disable";
        case UserAction.RESET_PASSWORD:
            return "Reset password";
        case UserAction.REMOVE:
            return "Remove";
        case UserAction.REPLICATE_USER_FROM_TEMPLATE:
            return "Replicate user from template";
        case UserAction.REPLICATE_USER_FROM_TABLE:
            return "Replicate user from table";
    }
}

export const userActions = Object.values(UserAction);
