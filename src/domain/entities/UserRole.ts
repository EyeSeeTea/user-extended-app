import { Struct } from "./generic/Struct";
import { Id } from "./Ref";
import { User } from "./User";

export type UserRoleAttrs = {
    id: Id;
    description: string;
    name: string;
    users: Pick<User, "id" | "name">[];
};

export class UserRole extends Struct<UserRoleAttrs>() {
    excludedUsers(usersIds: string[]): UserRole {
        const userIdsSet = new Set(usersIds);
        return this._update({
            users: this.users.filter(user => {
                return userIdsSet.has(user.id);
            }),
        });
    }
}
