import { FutureData } from "../entities/Future";
import { UserSearch } from "../entities/UserSearch";

export interface UserSearchRepository {
    search(query: string): FutureData<UserSearch>;
}
