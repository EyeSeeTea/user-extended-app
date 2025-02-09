import { D2Api } from "@eyeseetea/d2-api/2.36";
import { UserSearchRepository } from "../../domain/repositories/UserSearchRepository";
import { UserSearch } from "../../domain/entities/UserSearch";
import { FutureData } from "../../domain/entities/Future";
import { apiToFuture } from "../../utils/futures";

export class UserSearchD2Repository implements UserSearchRepository {
    constructor(private api: D2Api) {}

    search(query: string): FutureData<UserSearch> {
        const options = {
            fields: { id: true, displayName: true },
            filter: { displayName: { ilike: query } },
        };

        return apiToFuture<UserSearch>(this.api.metadata.get({ users: options, userGroups: options }));
    }
}
