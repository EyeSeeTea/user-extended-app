import _ from "lodash";
import { UserIdentifier } from "../../entities/UserIdentifier";

export function excludeUsers<T extends { excludedUsers(userIds: string[]): T }>(
    users: UserIdentifier[],
    entities: T[]
): T[] {
    const usersIds = _(users)
        .map(user => user.id)
        .compact()
        .uniq()
        .value();

    return entities.map(entity => entity.excludedUsers(usersIds));
}
