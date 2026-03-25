import { FutureData } from "../entities/Future";
import { Column } from "../entities/UserColumn";

export interface UserColumnRepository {
    get(): FutureData<Column[]>;
    save(columns: Column[]): FutureData<void>;
}
