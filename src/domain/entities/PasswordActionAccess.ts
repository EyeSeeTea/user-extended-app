import { User } from "./User";
import { UserAction } from "./UserAction";
import { allUsersBelongToAtLeastOneOrgUnit, isSuperAdmin, userOrgUnitIds, UserProps } from "./UserProps";

const passwordActions: UserAction[] = [UserAction.SET_PASSWORD, UserAction.RESET_PASSWORD];

export function isPasswordAction(action: UserAction): boolean {
    return passwordActions.includes(action);
}

/**
 * Password actions can be limited to the users assigned to the logged user's data capture
 * organisation units and below, through the `limitPasswordActionsToUserOrgUnits` app setting.
 *
 * Unlike UserActionRule rules, this policy is mandatory: it is NOT bypassed by the action
 * whitelist, which is precisely what allows a user granted "Set password" to change the password
 * of any other user. Super admins (ALL) are exempt, so server administration is never locked out.
 */
export function canRunPasswordActionOnUsers(args: {
    currentUser: UserProps;
    users: User[];
    isLimitedToOrgUnits: boolean;
}): boolean {
    const { currentUser, users, isLimitedToOrgUnits } = args;

    if (!isLimitedToOrgUnits) return true;
    if (isSuperAdmin(currentUser)) return true;

    return allUsersBelongToAtLeastOneOrgUnit(users, userOrgUnitIds(currentUser));
}
