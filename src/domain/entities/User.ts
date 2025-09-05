import _ from "lodash";
import { Maybe } from "../../types/utils";
import { OrgUnit } from "./OrgUnit";
import { getId, Id, NamedRef } from "./Ref";

export interface User {
    id: string;
    name: string;
    username: string;
    firstName: string;
    surname: string;
    email: string;
    phoneNumber: string;
    whatsApp: string;
    facebookMessenger: string;
    skype: string;
    telegram: string;
    twitter: string;
    lastUpdated: Date;
    created: Date;
    apiUrl: string;
    userRoles: NamedRef[];
    userGroups: NamedRef[];
    organisationUnits: OrgUnit[];
    dataViewOrganisationUnits: OrgUnit[];
    searchOrganisationsUnits: OrgUnit[];
    lastLogin: Maybe<Date>;
    status: string;
    disabled: boolean;
    access: AccessPermissions;
    openId: Maybe<string>;
    ldapId: Maybe<string>;
    externalAuth: boolean;
    password: string;
    accountExpiry: Maybe<string>;
    authorities: string[];
    createdBy: Maybe<UserAudit>;
    lastModifiedBy: Maybe<UserAudit>;
    uiLocale: LocaleCode;
    dbLocale: LocaleCode;
}

export interface UserAudit {
    id: Id;
    username: string;
}

const emptyOrgUnit: OrgUnit = { id: "", name: "", code: "", path: [] };

export const defaultUser: User = {
    id: "",
    name: "",
    username: "",
    firstName: "",
    surname: "",
    email: "",
    phoneNumber: "",
    whatsApp: "",
    facebookMessenger: "",
    skype: "",
    telegram: "",
    twitter: "",
    lastUpdated: new Date(),
    created: new Date(),
    apiUrl: "",
    userRoles: [{ id: "", name: "" }],
    userGroups: [{ id: "", name: "" }],
    organisationUnits: [emptyOrgUnit],
    dataViewOrganisationUnits: [emptyOrgUnit],
    searchOrganisationsUnits: [emptyOrgUnit],
    lastLogin: new Date(),
    status: "",
    disabled: false,
    access: { read: true, update: true, externalize: true, delete: true, write: true, manage: true },
    openId: "",
    ldapId: "",
    externalAuth: false,
    password: "",
    authorities: [""],
    createdBy: { id: "", username: "" },
    lastModifiedBy: { id: "", username: "" },
    accountExpiry: undefined,
    uiLocale: "",
    dbLocale: "",
};
export interface AccessPermissions {
    read: boolean;
    update: boolean;
    externalize: boolean;
    delete: boolean;
    write: boolean;
    manage: boolean;
}

export function isSuperAdmin(user: User): boolean {
    return user.authorities.includes("ALL");
}

export function hasReplicateAuthority(user: User): boolean {
    return user.authorities.includes("F_REPLICATE_USER");
}

export function allUsersHaveAllSpecifiedAccesses(users: User[], accesses: string[]): boolean {
    return users.every(user => {
        const userAccesses = _(user.access)
            .pickBy(access => Boolean(access))
            .keys()
            .value();

        return accesses.every(key => userAccesses.includes(key));
    });
}

export function userWithinOrgUnits(user: User, organisationUnitIds: Id[]): boolean {
    const inheretedOrgUnits = userInheritedOrgUnitIds(user);
    return organisationUnitIds.some(orgUnitId => inheretedOrgUnits.includes(orgUnitId));
}

export function userInheritedOrgUnitIds(user: User): Id[] {
    const allOrgUnitIds = user.organisationUnits.flatMap(orgUnit => orgUnit.path);
    return _.uniq(allOrgUnitIds);
}

export function userOrgUnitIds(user: User): Id[] {
    return user.organisationUnits.map(getId);
}

export function allUsersHaveEmail(users: User[]): boolean {
    return users.every(user => Boolean(user.email));
}

export function allUsersBelongToAtLeastOneOrgUnit(users: User[], orgUnitIds: Id[]) {
    return users.every(user => userWithinOrgUnits(user, orgUnitIds));
}

export function allUsersAreDisabled(users: User[]) {
    return users.every(user => user.disabled);
}

export function allUsersAreActive(users: User[]) {
    return users.every(user => !user.disabled);
}

export type LocaleCode = string;

export type UserColumns = keyof User;
