import { DashboardOwner } from "../entities/DashboardOwner";
import { FutureData } from "../entities/Future";
import { DashboardOwnerRepository } from "../repositories/DashboardOwnerRepository";

export class GetDashboardOwnersUseCase {
    constructor(private dashboardOwnerRepository: DashboardOwnerRepository) {}

    execute(): FutureData<DashboardOwner[]> {
        return this.dashboardOwnerRepository.get();
    }
}
