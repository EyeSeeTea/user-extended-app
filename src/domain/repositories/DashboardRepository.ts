import { Maybe } from "../../types/utils";
import { Dashboard } from "../entities/Dashboard";
import { FutureData } from "../entities/Future";
import { CommonFilterParams } from "../entities/PaginatedResponse";
import { Id } from "../entities/Ref";

export interface DashboardRepository {
    getAll(options: { hideUsers: Maybe<Id[]>; hideGroups: Maybe<Id[]> }): FutureData<Dashboard[]>;
}

export type GetDashboardOptions = CommonFilterParams & {
    filters: { ownerUsersIds: Maybe<Id[]> };
    hideUsers: Maybe<Id[]>;
    hideGroups: Maybe<Id[]>;
};
