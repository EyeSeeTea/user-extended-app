import { NamedRef } from "./Ref";

export type Permission = {
    publicAccess: string; // '------' | 'r-----'  | 'rw----'
    users: NamedRef[];
    userGroups: NamedRef[];
};

export function isPermissionPublic(permission: Permission): boolean {
    return permission.publicAccess.startsWith("r");
}
