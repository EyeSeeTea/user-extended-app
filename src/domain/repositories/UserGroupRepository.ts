import { FutureData } from "../entities/Future";
import { UserGroup } from "../entities/UserGroup";

export interface UserGroupRepository {
    getAll(): FutureData<UserGroup[]>;
}
