import { Struct } from "./generic/Struct";
import { Id, NamedRef } from "./Ref";

//FIXME: To remove name and just maintain id
export type PermissionAttrs = {
    users: NamedRef[];
    userGroups: NamedRef[];
};

export class Permission extends Struct<PermissionAttrs>() {
    isAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        return isPermissionAccessible(this, args);
    }
}

export function isPermissionAccessible(permission: Permission, args: { userId: Id; userGroupIds: Id[] }): boolean {
    const { userId, userGroupIds } = args;

    const userAccess = permission.users.some(u => u.id === userId);
    const groupAccess = permission.userGroups.some(({ id: permissionUserGroupId }) =>
        userGroupIds.includes(permissionUserGroupId)
    );

    return userAccess || groupAccess;
}
