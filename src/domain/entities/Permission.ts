import _ from "lodash";
import { Struct } from "./generic/Struct";
import { Id, NamedRef } from "./Ref";

type PermissionAttrs = {
    users: NamedRef[];
    userGroups: NamedRef[];
};

export class Permission extends Struct<PermissionAttrs>() {
    isAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        return isPermissionAccessible(this, args);
    }
}

export class PublicPermission extends Struct<PermissionAttrs>() {
    static public(): PublicPermission {
        return new PublicPermission({
            users: [],
            userGroups: [],
        });
    }

    get isPublic(): boolean {
        return _.isEmpty(this.users) && _.isEmpty(this.userGroups);
    }

    updateUsers(users: NamedRef[]): PublicPermission {
        return this._update({
            users,
        });
    }

    updateUserGroups(userGroups: NamedRef[]): PublicPermission {
        return this._update({
            userGroups,
        });
    }

    isAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        if (this.isPublic) return true;
        return isPermissionAccessible(this, args);
    }
}

function isPermissionAccessible(permission: Permission, args: { userId: Id; userGroupIds: Id[] }): boolean {
    const { userId, userGroupIds } = args;

    const userAccess = permission.users.some(u => u.id === userId);
    const groupAccess = permission.userGroups.some(({ id: permissionUserGroupId }) =>
        userGroupIds.includes(permissionUserGroupId)
    );

    return userAccess || groupAccess;
}
