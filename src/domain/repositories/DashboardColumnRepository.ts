import { DashboardColumnSetting } from "../entities/DashboardColumn";
import { FutureData } from "../entities/Future";

export interface DashboardColumnRepository {
    get(): FutureData<DashboardColumnSetting[]>;
    save(columns: DashboardColumnSetting[]): FutureData<void>;
}
