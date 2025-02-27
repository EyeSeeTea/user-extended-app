import { Dashboard } from "../entities/Dashboard";
import { FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { DashboardRepository, GetDashboardOptions } from "../repositories/DashboardRepository";

export class GetDashboardsUseCase {
    constructor(private dashboardRepository: DashboardRepository) {}

    execute(options: GetDashboardOptions): FutureData<PaginatedResponse<Dashboard>> {
        return this.dashboardRepository.get(options);
    }
}
