import { DashboardOwner } from "../entities/DashboardOwner";
import { FutureData } from "../entities/Future";

export interface DashboardOwnerRepository {
    get(): FutureData<DashboardOwner[]>;
}
