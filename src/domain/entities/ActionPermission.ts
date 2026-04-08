import _ from "lodash";
import { Struct } from "./generic/Struct";
import { isPermissionAccessible, PermissionAttrs } from "./Permission";
import { Id, NamedRef } from "./Ref";
import { getInternalRules, getSelectableRules, UserActionRule } from "./UserActionRule";

type ActionPermissionAttrs = PermissionAttrs & {
    rules: UserActionRule[];
};

export class ActionPermission extends Struct<ActionPermissionAttrs>() {
    static public(): ActionPermission {
        return this.create({
            users: [],
            userGroups: [],
            rules: [], // Internal rules should be added (but it depends on the action)
        });
    }

    // Even if isPublic returns true, rule validations must be executed
    get isPublic(): boolean {
        const removedInternalRules = this.getSelectableRules();
        return _.isEmpty(this.users) && _.isEmpty(this.userGroups) && _.isEmpty(removedInternalRules);
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

    getInternalRules(): UserActionRule[] {
        const internalRules = getInternalRules();
        return this.rules.filter(rule => internalRules.includes(rule));
    }

    getSelectableRules(): UserActionRule[] {
        const selectableRules = getSelectableRules();
        return this.rules.filter(rule => selectableRules.includes(rule));
    }

    isAccessibleViaWhitelist(args: { userId: Id; userGroupIds: Id[] }): boolean {
        return isPermissionAccessible(this, args);
    }
}
