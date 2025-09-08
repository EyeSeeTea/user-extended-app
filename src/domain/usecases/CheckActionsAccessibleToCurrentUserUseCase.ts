import _ from "lodash";
import { ActionsPermissions } from "../entities/AppSettings";
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
} from "../entities/User";
import { getId, Id } from "../entities/Ref";
import { UserAction } from "../entities/UserAction";
import { UserActionRule } from "../entities/UserActionRule";
import { ActionPermission } from "../entities/ActionPermission";

// Old Note for Reviewer: I made it sync to make it reactive, so I have the doubt if it shouldn't be a use case and just on the useHook
// but as there is a CheckCurrentUserCanAccessSettingsUseCase it makes sense to have  this also as a usecase
export class CheckActionsAccessibleToCurrentUserUseCase {
    execute(currentUser: User, actionsAccess: ActionsPermissions): Record<UserAction, ActionAccessibleValidator> {
        return this.checkActionsAccessible(currentUser, actionsAccess);
    }

    private checkActionsAccessible(
        currentUser: User,
        actionsAccess: ActionsPermissions
    ): Record<UserAction, ActionAccessibleValidator> {
        const currentUserOrgUnitIds = userOrgUnitIds(currentUser);

        return _.mapValues(actionsAccess, (permission, _action) => {
            const hasWhitelistAccess = this.hasAccessViaWhitelist(currentUser, permission);

            return (users: User[]) => {
                if (hasWhitelistAccess) return true;
                return this.validateRuleAccess({
                    currentUser,
                    rules: permission.rules,
                    users,
                    currentUserOrgUnitIds,
                });
            };
        });
    }

    private hasAccessViaWhitelist(currentUser: User, permission: ActionPermission) {
        return (
            isSuperAdmin(currentUser) ||
            permission.isAccessibleViaWhitelist({
                userId: currentUser.id,
                userGroupIds: currentUser.userGroups.map(getId),
            })
        );
    }

    private validateRuleAccess(args: {
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
}

type ActionAccessibleValidator = (users: User[]) => boolean;
