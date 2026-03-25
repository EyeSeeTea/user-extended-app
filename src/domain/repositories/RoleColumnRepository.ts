import { FutureData } from "../entities/Future";
import { RoleColumnSetting } from "../entities/RoleColumn";

export interface RoleColumnRepository {
    get(): FutureData<RoleColumnSetting[]>;
    save(columns: RoleColumnSetting[]): FutureData<void>;
}
