import { UserIdentifier } from "../../entities/UserIdentifier";
import { UserSimple } from "../../entities/UserSimple";

export function toUserSimple(identifier: UserIdentifier): UserSimple {
    return UserSimple.create({
        id: identifier.id,
        name: identifier.name,
        firstName: identifier.name,
        lastName: "",
        email: "",
        username: identifier.username,
    });
}
