import { Dashboard } from "../entities/Dashboard";
import { FutureData } from "../entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../entities/PaginatedResponse";
import { Id } from "../entities/Ref";

export interface DashboardRepository {
    get(options: GetDashboardOptions): FutureData<PaginatedResponse<Dashboard>>;
}

export type GetDashboardOptions = CommonFilterParams & {
    filters: { ownerUsersIds?: Id[] };
};
