import { D2Api } from "@eyeseetea/d2-api/2.36";
import { FutureData } from "../../domain/entities/Future";
import { UserRole } from "../../domain/entities/UserRole";
import { UserRoleRepository } from "../../domain/repositories/UserRoleRepository";
import { apiToFuture } from "../../utils/futures";

export class UserRoleD2Repository implements UserRoleRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<UserRole[]> {
        return apiToFuture(
            this.api.models.userRoles
                .get({
                    fields: {
                        id: true,
                        displayName: true,
                    },
                    paging: false,
                })
                .map(res => res.data.objects.map(({ id, displayName }) => ({ id, name: displayName })))
        );
    }
}
