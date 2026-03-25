import { D2Api } from "../../types/d2-api";
import { UserSearchRepository } from "../../domain/repositories/UserSearchRepository";
import { UserSearch } from "../../domain/entities/UserSearch";
import { FutureData } from "../../domain/entities/Future";
import { apiToFuture } from "../../utils/futures";

export class UserSearchD2Repository implements UserSearchRepository {
    constructor(private api: D2Api) {}

    search(name: string): FutureData<UserSearch> {
        const options = {
            fields: { id: true, displayName: true },
            filter: { displayName: { ilike: name } },
        };

        return apiToFuture(this.api.metadata.get({ users: options, userGroups: options })).map(userSearch => ({
            users: userSearch.users.map(user => ({ id: user.id, name: user.displayName })),
            userGroups: userSearch.userGroups.map(userGroup => ({ id: userGroup.id, name: userGroup.displayName })),
        }));
    }
}
