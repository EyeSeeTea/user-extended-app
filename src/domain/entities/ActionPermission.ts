import _ from "lodash";
import { Struct } from "./generic/Struct";
import { isPermissionAccessible, PermissionAttrs } from "./Permission";
import { Id, NamedRef } from "./Ref";
import { getSelectableRules, Rule } from "./Rule";

type ActionPermissionAttrs = PermissionAttrs & {
    rules: Rule[];
};

export class ActionPermission extends Struct<ActionPermissionAttrs>() {
    static public(): ActionPermission {
        return new ActionPermission({
            users: [],
            userGroups: [],
            rules: [], // Mandatory rules should be added (but it depends on the action)
        });
    }

    // Even if isPublic returns true, rule validations must be executed
    get isPublic(): boolean {
        const selectableRules = getSelectableRules();
        const removedMandatory = this.rules.filter(rule => selectableRules.includes(rule));
        return _.isEmpty(this.users) && _.isEmpty(this.userGroups) && _.isEmpty(removedMandatory);
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

    updateRules(rules: Rule[]): ActionPermission {
        return this._update({
            rules: _.uniq(rules),
        });
    }

    isAccessibleViaWhitelist(args: { userId: Id; userGroupIds: Id[] }): boolean {
        return isPermissionAccessible(this, args);
    }
}
