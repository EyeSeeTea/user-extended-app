import { Struct } from "./generic/Struct";
import { Id, NamedRef } from "./Ref";

export type PermissionAttrs = {
    users: NamedRef[];
    userGroups: NamedRef[];
};

export class Permission extends Struct<PermissionAttrs>() {
    isAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        return isPermissionAccessible(this, args);
    }

    isEmpty(): boolean {
        return this.users.length === 0 && this.userGroups.length === 0;
    }
}

/* Acts as a whitelist. If not present or permission users and userGroups are empty, then no access is granted */
export function isPermissionAccessible(permission: PermissionAttrs, args: { userId: Id; userGroupIds: Id[] }): boolean {
    const { userId, userGroupIds } = args;

    const userAccess = permission.users.some(u => u.id === userId);
    const groupAccess = permission.userGroups.some(({ id: permissionUserGroupId }) =>
        userGroupIds.includes(permissionUserGroupId)
    );

    return userAccess || groupAccess;
}
