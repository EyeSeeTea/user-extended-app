import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/entities/Future";
import { apiToFuture } from "../../utils/futures";
import { DashboardOwner } from "../../domain/entities/DashboardOwner";
import { DashboardOwnerRepository } from "../../domain/repositories/DashboardOwnerRepository";
import { chunkRequest } from "../utils";
import { NamedRef } from "../../domain/entities/Ref";

export class DashboardOwnerD2Repository implements DashboardOwnerRepository {
    constructor(private api: D2Api) {}

    get(): FutureData<DashboardOwner[]> {
        return apiToFuture(
            this.api.models.dashboards.get({
                fields: { sharing: { owner: true } },
                paging: false,
            })
        ).flatMap(response => {
            const allUserIds = _(response.objects)
                .map(d2Dashboard => d2Dashboard.sharing.owner)
                .uniq()
                .value();

            return this.getUsersByIds(allUserIds).map(users => {
                return _(users)
                    .map(user => DashboardOwner.build({ id: user.id, name: user.name }))
                    .sortBy(owner => owner.name)
                    .value();
            });
        });
    }

    private getUsersByIds(ids: string[]): FutureData<NamedRef[]> {
        return chunkRequest(
            ids,
            chunkIds => {
                return apiToFuture(
                    this.api.models.users.get({
                        filter: { id: { in: chunkIds } },
                        fields: { id: true, displayName: true },
                        paging: false,
                    })
                ).map(response => response.objects.map(user => ({ id: user.id, name: user.displayName })));
            },
            50
        );
    }
}
