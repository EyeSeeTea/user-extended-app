import _ from "lodash";
import { Struct } from "./generic/Struct";
import { isPermissionAccessible, PermissionAttrs } from "./Permission";
import { Id, NamedRef } from "./Ref";
import { getSelectableRules, UserActionRule } from "./UserActionRule";

type ActionPermissionAttrs = PermissionAttrs & {
    rules: UserActionRule[];
};

export class ActionPermission extends Struct<ActionPermissionAttrs>() {
    static public(): ActionPermission {
        return new ActionPermission({
            users: [],
            userGroups: [],
            rules: [], // Internal rules should be added (but it depends on the action)
        });
    }

    // Even if isPublic returns true, rule validations must be executed
    get isPublic(): boolean {
        const selectableRules = getSelectableRules();
        const removedInternal = this.rules.filter(rule => selectableRules.includes(rule));
        return _.isEmpty(this.users) && _.isEmpty(this.userGroups) && _.isEmpty(removedInternal);
    }

    updateUsers(users: NamedRef[]): ActionPermission {
        return this._update({
            users,
        });
    }

    updateUserGroups(userGroups: NamedRef[]): ActionPermission {
        return this._update({
            userGroups,
        });
    }

    updateRules(rules: UserActionRule[]): ActionPermission {
        return this._update({
            rules: _.uniq(rules),
        });
    }

    isAccessibleViaWhitelist(args: { userId: Id; userGroupIds: Id[] }): boolean {
        return isPermissionAccessible(this, args);
    }
}
