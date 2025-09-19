import { isValueInUnionType } from "../../types/utils";
import { UserAction } from "./UserAction";

export enum UserActionRule {
    HAS_EMAIL = "has_email",
    USERS_WITHIN_LOGGED_USER_ORG_UNITS = "users_within_logged_user_org_units",
    HIDDEN = "hidden",
    UPDATE_ACCESS = "update_access",
    USER_IS_DISABLED = "user_is_disabled",
    USER_IS_NOT_DISABLED = "user_is_not_disabled",
    DELETE_ACCESS = "delete_access",
    REPLICATE_AUTHORITY = "replicate_authority",
}

type RuleProps = {
    isInternal: boolean; // Hidden rules
};

/**
 * Internal rules are: hidden rules that are always applied and not selectable in the UI,
 * and only live on runtime, not on persistence. Internal rules are applied after retrieving
 * the stored selectable rules, and removed before saved. New Internal rules, renaming, or
 * removing existing Internal rules shouldn't be a breaking change, as they don't affect the
 * stored rules. BUT selectable rules ARE a breaking change, as they affect the stored rules.
 * Migrations could be needed when removing or renaming selectable rules.
 */

const rules: Record<UserActionRule, RuleProps> = {
    [UserActionRule.USERS_WITHIN_LOGGED_USER_ORG_UNITS]: {
        isInternal: false,
    },
    [UserActionRule.HIDDEN]: {
        isInternal: false,
    },
    [UserActionRule.HAS_EMAIL]: {
        isInternal: true,
    },
    [UserActionRule.UPDATE_ACCESS]: {
        isInternal: true,
    },
    [UserActionRule.USER_IS_DISABLED]: {
        isInternal: true,
    },
    [UserActionRule.USER_IS_NOT_DISABLED]: {
        isInternal: true,
    },
    [UserActionRule.DELETE_ACCESS]: {
        isInternal: true,
    },
    [UserActionRule.REPLICATE_AUTHORITY]: {
        isInternal: true,
    },
} as const;

export const ruleKeys = Object.values(UserActionRule);

export function isRule(string: string): string is UserActionRule {
    return isValueInUnionType(string, ruleKeys);
}

export function getSelectableRules(): UserActionRule[] {
    return Object.entries(rules)
        .filter(([_, props]) => !props.isInternal)
        .map(([rule]) => rule)
        .filter(isRule);
}

export function getInternalRules(): UserActionRule[] {
    return Object.entries(rules)
        .filter(([_, props]) => props.isInternal)
        .map(([rule]) => rule)
        .filter(isRule);
}

export function ruleIsInternal(rule: UserActionRule): boolean {
    return rules[rule].isInternal;
}

export function ruleIsSelectable(rule: UserActionRule): boolean {
    return !rules[rule].isInternal;
}

//FIXME: Rules should live in UserActionRules.
// If actions are available or not, depends on the bussiness rules.
// Our platform will apply its own rules afterall on the backend side and could have other rules and even change them.
// These are our own rules. (Even if we mimic out platform rules)
export const defaultRules: Record<UserAction, UserActionRule[]> = {
    [UserAction.DETAILS]: [],
    [UserAction.EDIT]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.COPY_IN_USER]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.ASSIGN_TO_ORG_UNITS_SEARCH]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.ASSIGN_ROLES]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.ASSIGN_GROUPS]: [UserActionRule.UPDATE_ACCESS],
    [UserAction.ENABLE]: [UserActionRule.UPDATE_ACCESS, UserActionRule.USER_IS_DISABLED],
    [UserAction.DISABLE]: [UserActionRule.UPDATE_ACCESS, UserActionRule.USER_IS_NOT_DISABLED],
    [UserAction.RESET_PASSWORD]: [UserActionRule.HAS_EMAIL], // Should we add UPDATE_ACCESS too?
    [UserAction.SET_PASSWORD]: [UserActionRule.USERS_WITHIN_LOGGED_USER_ORG_UNITS], // Should we add UPDATE_ACCESS too?
    [UserAction.REMOVE]: [UserActionRule.DELETE_ACCESS],
    [UserAction.REPLICATE_USER_FROM_TEMPLATE]: [UserActionRule.REPLICATE_AUTHORITY],
    [UserAction.REPLICATE_USER_FROM_TABLE]: [UserActionRule.REPLICATE_AUTHORITY],
};

export function getInternalRulesForAction(action: UserAction): UserActionRule[] {
    return defaultRules[action].filter(ruleIsInternal);
}
