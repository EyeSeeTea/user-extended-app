import _ from "lodash";
import { Rule, ruleIsMandatory } from "./Rule";
import i18n from "../../locales";

// FIXME: Rename to UserActions
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

// FIXME: Label is a presentation concern (also applies for Column and Rules)
export function getUserActionLabel(action: UserAction): string {
    switch (action) {
        case UserAction.DETAILS:
            return i18n.t("Details");
        case UserAction.EDIT:
            return i18n.t("Edit");
        case UserAction.COPY_IN_USER:
            return i18n.t("Copy in user");
        case UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE:
            return i18n.t("Assign to data capture organisation units");
        case UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT:
            return i18n.t("Assign to data view organisation units");
        case UserAction.ASSIGN_TO_ORG_UNITS_SEARCH:
            return i18n.t("Assign to search organisation units");
        case UserAction.ASSIGN_ROLES:
            return i18n.t("Assign roles");
        case UserAction.ASSIGN_GROUPS:
            return i18n.t("Assign groups");
        case UserAction.ENABLE:
            return i18n.t("Enable");
        case UserAction.DISABLE:
            return i18n.t("Disable");
        case UserAction.RESET_PASSWORD:
            return i18n.t("Reset password");
        case UserAction.SET_PASSWORD:
            return i18n.t("Set password");
        case UserAction.REMOVE:
            return i18n.t("Remove");
        case UserAction.REPLICATE_USER_FROM_TEMPLATE:
            return i18n.t("Replicate user from template");
        case UserAction.REPLICATE_USER_FROM_TABLE:
            return i18n.t("Replicate user from table");
    }
}

export const userActions = Object.values(UserAction);

// If actions are available or not, depends on the bussiness rules.
// Our platform will apply its own rules afterall on the backend side and could have other rules and even change them.
// These are our own rules. (Even if we mimic out platform rules)
export const defaultRules: Record<UserAction, Rule[]> = {
    [UserAction.DETAILS]: [],
    [UserAction.EDIT]: [Rule.UPDATE_ACCESS],
    [UserAction.COPY_IN_USER]: [Rule.UPDATE_ACCESS],
    [UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE]: [Rule.UPDATE_ACCESS],
    [UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT]: [Rule.UPDATE_ACCESS],
    [UserAction.ASSIGN_TO_ORG_UNITS_SEARCH]: [Rule.UPDATE_ACCESS],
    [UserAction.ASSIGN_ROLES]: [Rule.UPDATE_ACCESS],
    [UserAction.ASSIGN_GROUPS]: [Rule.UPDATE_ACCESS],
    [UserAction.ENABLE]: [Rule.UPDATE_ACCESS, Rule.USER_IS_DISABLED],
    [UserAction.DISABLE]: [Rule.UPDATE_ACCESS, Rule.USER_IS_NOT_DISABLED],
    [UserAction.RESET_PASSWORD]: [Rule.HAS_EMAIL], // Should we add UPDATE_ACCESS too?
    [UserAction.SET_PASSWORD]: [Rule.USERS_WITHIN_LOGGED_USER_ORG_UNITS], // Should we add UPDATE_ACCESS too?
    [UserAction.REMOVE]: [Rule.DELETE_ACCESS],
    [UserAction.REPLICATE_USER_FROM_TEMPLATE]: [Rule.REPLICATE_AUTHORITY],
    [UserAction.REPLICATE_USER_FROM_TABLE]: [Rule.REPLICATE_AUTHORITY],
};

export function getMandatoryRulesForAction(action: UserAction): Rule[] {
    return defaultRules[action].filter(ruleIsMandatory);
}

// Presentation concern ALL.
// FIXME: icon is view concern, this is view model.
// FIXME: onClick is view concern, this is view model.
// FIXME: multiple is view concern, this is view model.
export function getUserActions2() {
    return _.mapValues(userActions, (action: UserAction) => ({
        name: action,
        text: getUserActionLabel(action),
    }));
}
