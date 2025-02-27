import { Struct } from "./generic/Struct";
import { Id } from "./Ref";
import { User } from "./User";

export type UserGroupAttrs = {
    id: Id;
    name: string;
    users: Pick<User, "id" | "name">[];
};

export class UserGroup extends Struct<UserGroupAttrs>() {
    excludedUsers(usersIds: string[]): UserGroup {
        const userIdsSet = new Set(usersIds);
        return this._update({
            users: this.users.filter(user => {
                return userIdsSet.has(user.id);
            }),
        });
    }
}
