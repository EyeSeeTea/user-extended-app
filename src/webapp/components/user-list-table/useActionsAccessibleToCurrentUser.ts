import React from "react";
import _ from "lodash";
import { ActionsPermissions } from "../../../domain/entities/AppSettings";
import {
    isSuperAdmin,
    User,
    allUsersHaveEmail,
    allUsersHaveAllSpecifiedAccesses,
    allUsersAreDisabled,
    allUsersAreActive,
    hasReplicateAuthority,
    userOrgUnitIds,
    allUsersBelongToAtLeastOneOrgUnit,
} from "../../../domain/entities/User";
import { getId, Id } from "../../../domain/entities/Ref";
import { UserAction } from "../../../domain/entities/UserAction";
import { UserActionRule } from "../../../domain/entities/UserActionRule";
import { ActionPermission } from "../../../domain/entities/ActionPermission";

export function useActionsAccessibleToCurrentUser(
    currentUser: User,
    actionsAccess: ActionsPermissions
): Record<UserAction, ActionAccessibleValidator> {
    const currentUserOrgUnitIds = React.useMemo(() => userOrgUnitIds(currentUser), [currentUser]);

    const actionAccessMap = React.useMemo(
        () =>
            _.mapValues(actionsAccess, (permission, _action) => {
                const hasWhitelistAccess = hasAccessViaWhitelist(currentUser, permission);

                return (users: User[]) => {
                    const internalRules = permission.getInternalRules();
                    const selectableRules = permission.getSelectableRules();

                    const validInternalRules = validateRuleAccess({
                        currentUser,
                        rules: internalRules,
                        users,
                        currentUserOrgUnitIds,
                    });

                    if (!validInternalRules) return false; // Internal rules are mandatory to validate
                    if (hasWhitelistAccess) return true;

                    const validSelectableRules = validateRuleAccess({
                        currentUser,
                        rules: selectableRules,
                        users,
                        currentUserOrgUnitIds,
                    });

                    return validSelectableRules;
                };
            }),
        [actionsAccess, currentUser, currentUserOrgUnitIds]
    );

    return actionAccessMap;
}

function hasAccessViaWhitelist(currentUser: User, permission: ActionPermission) {
    return (
        isSuperAdmin(currentUser) ||
        permission.isAccessibleViaWhitelist({
            userId: currentUser.id,
            userGroupIds: currentUser.userGroups.map(getId),
        })
    );
}

function validateRuleAccess(args: {
    currentUser: User;
    rules: UserActionRule[];
    users: User[];
    currentUserOrgUnitIds: Id[];
}): boolean {
    const { currentUser, rules, users, currentUserOrgUnitIds } = args;
    if (rules.length === 0) return true;

    return rules.every(rule => {
        switch (rule) {
            case UserActionRule.HIDDEN:
                return false;
            case UserActionRule.HAS_EMAIL:
                return allUsersHaveEmail(users);
            case UserActionRule.USERS_WITHIN_LOGGED_USER_ORG_UNITS:
                return allUsersBelongToAtLeastOneOrgUnit(users, currentUserOrgUnitIds);
            case UserActionRule.UPDATE_ACCESS:
                return allUsersHaveAllSpecifiedAccesses(users, ["update"]);
            case UserActionRule.DELETE_ACCESS:
                return allUsersHaveAllSpecifiedAccesses(users, ["delete"]);
            case UserActionRule.USER_IS_DISABLED:
                return allUsersAreDisabled(users);
            case UserActionRule.USER_IS_NOT_DISABLED:
                return allUsersAreActive(users);
            case UserActionRule.REPLICATE_AUTHORITY:
                return hasReplicateAuthority(currentUser);
            default:
                return true;
        }
    });
}

type ActionAccessibleValidator = (users: User[]) => boolean;
