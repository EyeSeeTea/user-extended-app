import { Id } from "@eyeseetea/d2-api";
import { NamedRef } from "./Ref";

export type Permission = {
    publicAccess: string; // '------' | 'r-----'  | 'rw----'
    users: NamedRef[];
    userGroups: NamedRef[];
};

export function isPermissionPublic(permission: Permission): boolean {
    return permission.publicAccess.startsWith("r");
}

// REFACTOR: make permission a class
export function isPermissionAccessible(args: { userId: Id; userGroupIds: Id[]; permission: Permission }): boolean {
    const { userId, userGroupIds, permission } = args;

    const publicAccess = isPermissionPublic(permission);
    const directAccess = permission.users.some(u => u.id === userId);
    const groupAccess = permission.userGroups.some(({ id: permissionUserGroupId }) =>
        userGroupIds.includes(permissionUserGroupId)
    );

    return publicAccess || directAccess || groupAccess;
}
