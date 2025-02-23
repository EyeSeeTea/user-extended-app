import { FutureData } from "../entities/Future";
import { UserSearch } from "../entities/UserSearch";

export interface UserSearchRepository {
    search(name: string): FutureData<UserSearch>;
}
