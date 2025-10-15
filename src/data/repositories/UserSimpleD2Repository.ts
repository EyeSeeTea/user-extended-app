import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/entities/Future";
import { UserSimpleRepository } from "../../domain/repositories/UserSimpleRepository";
import { apiToFuture } from "../../utils/futures";
import { chunkRequest } from "../utils";
import { UserSimple } from "../../domain/entities/UserSimple";

export class UserSimpleD2Repository implements UserSimpleRepository {
    constructor(private api: D2Api) {}

    getByIds(ids: string[]): FutureData<UserSimple[]> {
        return chunkRequest(ids, usersIds => {
            return apiToFuture(
                this.api.models.users.get({
                    fields: { id: true, name: true, email: true, surname: true },
                    filter: { id: { in: usersIds } },
                    paging: false,
                })
            ).map(d2Response => {
                return d2Response.objects.map((d2User): UserSimple => {
                    return UserSimple.create({
                        id: d2User.id,
                        name: d2User.name,
                        lastName: d2User.surname,
                        email: d2User.email ?? "",
                    });
                });
            });
        });
    }
}
