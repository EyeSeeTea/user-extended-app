import { FutureData } from "../entities/Future";
import { Id } from "../entities/Ref";
import { UserSimple } from "../entities/UserSimple";

export interface UserSimpleRepository {
    getByIds(ids: Id[]): FutureData<UserSimple[]>;
}
