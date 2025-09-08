import _ from "lodash";
import React from "react";
import { DropdownItem, useSnackbar } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { SharingActionsProps } from "./SharingActions";
import { UserGroup } from "../../../domain/entities/UserGroup";
import { ActionsPermissions } from "../../../domain/entities/AppSettings";
import { getId, Id } from "../../../domain/entities/Ref";
import { UserAction } from "../../../domain/entities/UserAction";
import { UserActionRule, getInternalRulesForAction, getSelectableRules } from "../../../domain/entities/UserActionRule";
import { ActionPermission } from "../../../domain/entities/ActionPermission";
import i18n from "../../../locales";

export function useSharingActions(props: SharingActionsProps) {
    const { actionsPermissions, setActionsPermissions } = props;

    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const [allUserGroups, setUserGroups] = React.useState<UserGroup[]>([]);
    const [selectedValues, setSelectedValues] = React.useState<Record<UserAction, Value[]>>(
        mapSelectedValues(actionsPermissions)
    );

    const setSelectedValuesByAction = React.useCallback(
        (action: UserAction) => (values: Value[]) => {
            setSelectedValues(previousValuesByAction => {
                const isPublicSelected =
                    values.includes("public-access") && !previousValuesByAction[action].includes("public-access");
                const shouldForcePublic = isPublicSelected || _.isEmpty(values);
                const shouldFilterOutPublic = values.length > 1;
                const removedPublic = values.filter(value => value !== "public-access");

                const newValues = shouldForcePublic
                    ? ["public-access"]
                    : shouldFilterOutPublic
                    ? removedPublic
                    : values;

                setActionsPermissions(actionsPermissions => {
                    // Note: Default rules don't necessarily mean internal
                    const newActionPermission = shouldForcePublic
                        ? ActionPermission.public()
                        : actionsPermissions[action].updateUserGroups(
                              allUserGroups.filter(userGroup => removedPublic.includes(userGroup.id))
                          );

                    const newActionPermissionWithInternalRules = newActionPermission.updateRules(
                        getInternalRulesForAction(action)
                    );

                    return {
                        ...actionsPermissions,
                        [action]: newActionPermissionWithInternalRules,
                    };
                });

                return {
                    ...previousValuesByAction,
                    [action]: newValues,
                };
            });
        },
        [allUserGroups, setActionsPermissions]
    );

    const items = React.useMemo(() => {
        const publicAccessItem = buildPublicAccessItem();
        const ruleItems = buildRuleItems();

        return [publicAccessItem].concat(ruleItems).concat(
            allUserGroups.map(userGroup => ({
                value: userGroup.id,
                text: userGroup.name,
            }))
        );
    }, [allUserGroups]);

    React.useEffect(() => {
        return compositionRoot.userGroups.getAll().run(setUserGroups, snackbar.error);
    }, [compositionRoot.userGroups, snackbar.error]);

    return {
        items,
        selectedValues,
        setSelectedValues: setSelectedValuesByAction,
    };
}

function buildPublicAccessItem(): DropdownItem {
    return {
        value: "public-access",
        text: i18n.t("Public access (Everyone)"),
    };
}

function getRuleLabel(rule: UserActionRule): string {
    switch (rule) {
        case UserActionRule.HAS_EMAIL:
            return i18n.t("User has email address");
        case UserActionRule.USERS_WITHIN_LOGGED_USER_ORG_UNITS:
            return i18n.t("Only available for users assigned to users' organization unit and below");
        case UserActionRule.HIDDEN:
            return i18n.t("Hidden");
        case UserActionRule.UPDATE_ACCESS:
            return i18n.t("Only available if user has update access over the users");
        case UserActionRule.USER_IS_DISABLED:
            return i18n.t("Only available for disabled users");
        case UserActionRule.USER_IS_NOT_DISABLED:
            return i18n.t("Only available for active users");
        case UserActionRule.DELETE_ACCESS:
            return i18n.t("Only available if user has delete access over the users");
        case UserActionRule.REPLICATE_AUTHORITY:
            return i18n.t("Only available if user has replicate authority on some owned role");
    }
}

function buildRuleItems(): DropdownItem[] {
    return getSelectableRules().map(rule => ({
        value: rule,
        text: i18n.t("[RULE] ") + getRuleLabel(rule),
        /* With "[RULE] {{rule}}" HTML encoding-decoding was breaking for USERS_WITHIN_LOGGED_USER_ORG_UNITS single quote */
    }));
}

function mapSelectedValues(actionsPermissions: ActionsPermissions): Record<UserAction, Value[]> {
    return _.mapValues(actionsPermissions, permission => {
        if (permission.isPublic) {
            return ["public-access"];
        }

        const userGroupValues = permission.userGroups.map(getId);
        const ruleValues = permission.rules || [];

        return [...userGroupValues, ...ruleValues];
    });
}

export type Value = Id | UserActionRule;
