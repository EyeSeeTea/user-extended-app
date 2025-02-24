import { D2Api } from "@eyeseetea/d2-api/2.36";
import { FutureData } from "../../domain/entities/Future";
import { UserGroup } from "../../domain/entities/UserGroup";
import { UserGroupRepository } from "../../domain/repositories/UserGroupRepository";
import { apiToFuture } from "../../utils/futures";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<UserGroup[]> {
        return apiToFuture(
            this.api.models.userGroups
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
