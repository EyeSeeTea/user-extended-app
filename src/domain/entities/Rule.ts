import i18n from "../../locales";
import { isValueInUnionType } from "../../types/utils";

// FIXME: change to UserActionRule?
export enum Rule {
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
    isMandatory: boolean; // Hidden rules
};

// FIXME: mandatory is a bit still confusing. Rename to "hidden"? or "nonSelectable"?
// Other possible names: systemRule, systemDefinedRule, fixedRule, nonUserDefinedRule, nonUserSelectableRule
// Mandatory rules are: 1) Hidden rules that are always applied and not selectable in the UI, and only live on runtime, not on persistance
// "Mandatory" rules are applied after retrieving the stored selectable rules, and removed before saved.
// New mandatory rules, renaming, or removing existing mandatory rules shouldn't be a breaking change, as they don't affect the stored rules.
// BUT selectable rules ARE a breaking change, as they affect the stored rules. Migrations could be needed when removing or renaming selectable rules.

// isInternalUseOnly
const rules: Record<Rule, RuleProps> = {
    [Rule.USERS_WITHIN_LOGGED_USER_ORG_UNITS]: {
        isMandatory: false,
    },
    [Rule.HIDDEN]: {
        isMandatory: false,
    },
    [Rule.HAS_EMAIL]: {
        isMandatory: true,
    },
    [Rule.UPDATE_ACCESS]: {
        isMandatory: true,
    },
    [Rule.USER_IS_DISABLED]: {
        isMandatory: true,
    },
    [Rule.USER_IS_NOT_DISABLED]: {
        isMandatory: true,
    },
    [Rule.DELETE_ACCESS]: {
        isMandatory: true,
    },
    [Rule.REPLICATE_AUTHORITY]: {
        isMandatory: true,
    },
} as const;

export const ruleKeys = Object.values(Rule);

export function isRule(string: string): string is Rule {
    return isValueInUnionType(string, ruleKeys);
}

export function getSelectableRules(): Rule[] {
    return Object.entries(rules)
        .filter(([_, props]) => !props.isMandatory)
        .map(([rule]) => rule)
        .filter(isRule);
}

export function getMandatoryRules(): Rule[] {
    return Object.entries(rules)
        .filter(([_, props]) => props.isMandatory)
        .map(([rule]) => rule)
        .filter(isRule);
}

export function ruleIsMandatory(rule: Rule): boolean {
    return rules[rule].isMandatory;
}

export function ruleIsSelectable(rule: Rule): boolean {
    return !rules[rule].isMandatory;
}

export function getRuleLabel(rule: Rule): string {
    switch (rule) {
        case Rule.HAS_EMAIL:
            return i18n.t("User has email address");
        case Rule.USERS_WITHIN_LOGGED_USER_ORG_UNITS:
            return i18n.t("Only available for users assigned to users' organization unit and below");
        case Rule.HIDDEN:
            return i18n.t("Hidden");
        case Rule.UPDATE_ACCESS:
            return i18n.t("Only available if user has update access over the users");
        case Rule.USER_IS_DISABLED:
            return i18n.t("Only available for disabled users");
        case Rule.USER_IS_NOT_DISABLED:
            return i18n.t("Only available for active users");
        case Rule.DELETE_ACCESS:
            return i18n.t("Only available if user has delete access over the users");
        case Rule.REPLICATE_AUTHORITY:
            return i18n.t("Only available if user has replicate authority on some owned role");
    }
}
