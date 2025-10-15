import _ from "lodash";
import { OrgUnit } from "../../entities/OrgUnit";

export function excludeUsers<T extends { excludedUsers(userIds: string[]): T }>(
    orgUnits: OrgUnit[],
    entities: T[]
): T[] {
    const usersIds = _(orgUnits)
        .flatMap(orgUnit => orgUnit.users)
        .compact()
        .uniq()
        .value();

    return entities.map(entity => entity.excludedUsers(usersIds));
}
