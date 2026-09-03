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
        return isPermissionEmpty(this);
    }
}

/* An empty whitelist grants no access to anybody */
export function isPermissionEmpty(permission: PermissionAttrs): boolean {
    return permission.users.length === 0 && permission.userGroups.length === 0;
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
