import { NamedRef } from "./Ref";

export type Permission = {
    publicAccess: string; // '--------' | 'r-------'  | 'rw------'
    users: NamedRef[];
    userGroups: NamedRef[];
};
