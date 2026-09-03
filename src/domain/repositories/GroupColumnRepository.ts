import { FutureData } from "../entities/Future";
import { GroupColumnSetting } from "../entities/GroupColumn";

export interface GroupColumnRepository {
    get(): FutureData<GroupColumnSetting[]>;
    save(columns: GroupColumnSetting[]): FutureData<void>;
}
