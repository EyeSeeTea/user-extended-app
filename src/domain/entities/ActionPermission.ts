import _ from "lodash";
import { Struct } from "./generic/Struct";
import { isPermissionAccessible, PermissionAttrs } from "./Permission";
import { Id, NamedRef } from "./Ref";
import { Rule } from "./Rule";

type ActionPermissionAttrs = PermissionAttrs & {
    rules: Rule[];
};

export class ActionPermission extends Struct<ActionPermissionAttrs>() {
    static public(): ActionPermission {
        return new ActionPermission({
            users: [],
            userGroups: [],
            rules: [],
        });
    }

    get isPublic(): boolean {
        return _.isEmpty(this.users) && _.isEmpty(this.userGroups) && _.isEmpty(this.rules);
    }
    // get isPublic(): boolean {
    //     const selectableRules = getSelectableRules();
    //     const removedMandatory = this.rules.filter(rule => selectableRules.includes(rule));
    //     return _.isEmpty(this.users) && _.isEmpty(this.userGroups) && _.isEmpty(removedMandatory);
    // }

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

    isAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        if (this.isPublic) return true;
        return isPermissionAccessible(this, args);
    }
}
