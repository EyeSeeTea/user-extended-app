import _ from "lodash";
import { NamedRef } from "./Ref";

export interface User {
    id: string;
    name: string;
    username: string;
    firstName: string;
    surname: string;
    email: string;
    lastUpdated: string;
    created: string;
    userRoles: UserRole[];
    userGroups: NamedRef[];
    organisationUnits: NamedRef[];
    dataViewOrganisationUnits: NamedRef[];
    lastLogin: string;
    disabled: boolean;
    access: AccessPermissions;
}

export interface UserRole extends NamedRef {
    authorities: string[];
}

export interface AccessPermissions {
    read?: boolean;
    update?: boolean;
    externalize?: boolean;
    delete?: boolean;
    write?: boolean;
    manage?: boolean;
}

export const isSuperAdmin = (user: User): boolean => {
    return _.some(user.userRoles, ({ authorities }) => authorities.includes("ALL"));
};

export const hasReplicateAuthority = (user: User): boolean => {
    return _.some(user.userRoles, ({ authorities }) => authorities.includes("F_REPLICATE_USER"));
};
