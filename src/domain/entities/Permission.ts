import _ from "lodash";
import { Struct } from "./generic/Struct";
import { Id, NamedRef } from "./Ref";

export class Permission extends Struct<{ users: NamedRef[]; userGroups: NamedRef[] }>() {
    isPermissionAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        const { userId, userGroupIds } = args;

        const userAccess = this.users.some(u => u.id === userId);
        const groupAccess = this.userGroups.some(({ id: permissionUserGroupId }) =>
            userGroupIds.includes(permissionUserGroupId)
        );

        return userAccess || groupAccess;
    }
}

type PublicPermissionAttrs = {
    users: NamedRef[];
    userGroups: NamedRef[];
    publicAccess: AccessValue;
};

export class PublicPermission extends Struct<PublicPermissionAttrs>() {
    static public(): PublicPermission {
        return new PublicPermission({
            users: [],
            userGroups: [],
            publicAccess: AccessValue.public(),
        });
    }

    updateUsers(users: NamedRef[]): PublicPermission {
        return this._update({
            users,
            publicAccess: _.isEmpty(users) && _.isEmpty(this.userGroups) ? AccessValue.public() : AccessValue.private(),
        });
    }

    updateUserGroups(userGroups: NamedRef[]): PublicPermission {
        return this._update({
            userGroups,
            publicAccess: _.isEmpty(this.users) && _.isEmpty(userGroups) ? AccessValue.public() : AccessValue.private(),
        });
    }

    get isPublic(): boolean {
        return this.publicAccess.read;
    }

    isPermissionAccessible(args: { userId: Id; userGroupIds: Id[] }): boolean {
        const { userId, userGroupIds } = args;

        if (this.isPublic) return true;

        const userAccess = this.users.some(u => u.id === userId);
        const groupAccess = this.userGroups.some(({ id: permissionUserGroupId }) =>
            userGroupIds.includes(permissionUserGroupId)
        );

        return userAccess || groupAccess;
    }
}

// Posibility of adding write access if needed in future
class AccessValue extends Struct<{ read: boolean }>() {
    static public() {
        return new AccessValue({ read: true });
    }

    static private() {
        return new AccessValue({ read: false });
    }
}
