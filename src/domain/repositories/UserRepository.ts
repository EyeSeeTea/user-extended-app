import { MetadataResponse } from "@eyeseetea/d2-api/2.36";
import { FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { NamedRef } from "../entities/Ref";
import { Stats } from "../entities/Stats";
import { UserProps } from "../entities/UserProps";

export interface UserRepository {
    getCurrent(): FutureData<UserProps>;
    list(options: ListOptions): FutureData<PaginatedResponse<UserProps>>;
    listAll(options: ListOptions): FutureData<UserProps[]>;
    listAllIds(options: ListOptions): FutureData<string[]>;
    getByIds(ids: string[]): FutureData<UserProps[]>;
    save(users: UserProps[]): FutureData<MetadataResponse>;
    updateRoles(ids: string[], update: NamedRef[], strategy: UpdateStrategy): FutureData<MetadataResponse>;
    updateGroups(ids: string[], update: NamedRef[], strategy: UpdateStrategy): FutureData<MetadataResponse>;
    getColumns(): FutureData<Array<keyof UserProps>>;
    saveColumns(columns: Array<keyof UserProps>): FutureData<void>;
    remove(users: UserProps[]): FutureData<Stats>;
}

export interface ListOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    sorting?: { field: string; order: "asc" | "desc" };
    filters?: ListFilters;
    canManage?: string;
    rootJunction?: "AND" | "OR";
}

export type ListFilterType = "in" | "eq" | "gt";
export type ListFilters = Record<string, [ListFilterType, string[]]>;
export type UpdateStrategy = "replace" | "merge";

export type AccessElements = {
    userGroups: boolean;
    userRoles: boolean;
    dataViewOrganisationUnits: boolean;
    organisationUnits: boolean;
};
export type AccessElementsKeys = keyof AccessElements;
