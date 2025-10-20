import { MetadataResponse } from "../../types/d2-api";
import { FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { Id, NamedRef } from "../entities/Ref";
import { Stats } from "../entities/Stats";
import { User } from "../entities/User";
import { UserIdentifier } from "../entities/UserIdentifier";

export interface UserRepository {
    getCurrent(): FutureData<User>;
    list(options: ListOptions): FutureData<PaginatedResponse<User>>;
    listAll(options: ListOptions): FutureData<User[]>;
    listAllUserIdentifiers(options: ListOptions): FutureData<UserIdentifier[]>;
    getByIds(ids: Id[]): FutureData<User[]>;
    save(users: User[]): FutureData<MetadataResponse>;
    saveInChunks(users: User[], chunkSize: number): FutureData<void>;
    updateRoles(ids: Id[], update: NamedRef[], strategy: UpdateStrategy): FutureData<MetadataResponse>;
    updateGroups(ids: Id[], update: NamedRef[], strategy: UpdateStrategy): FutureData<MetadataResponse>;
    getColumns(): FutureData<Array<keyof User>>;
    saveColumns(columns: Array<keyof User>): FutureData<void>;
    remove(ids: Id[]): FutureData<Stats>;
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
