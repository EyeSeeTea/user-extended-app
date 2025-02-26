import _ from "lodash";
import { Struct } from "./generic/Struct";
import { NamedRef } from "./Ref";

export type Permission = {
    users: NamedRef[];
    userGroups: NamedRef[];
};

type PublicPermissionAttrs = Permission & {
    publicAccess: AccessValue;
};

export class PublicPermission extends Struct<PublicPermissionAttrs>() {
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
