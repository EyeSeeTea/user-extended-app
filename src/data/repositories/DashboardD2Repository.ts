import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { Dashboard } from "../../domain/entities/Dashboard";
import { FutureData } from "../../domain/entities/Future";
import { PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { DashboardRepository, GetDashboardOptions } from "../../domain/repositories/DashboardRepository";
import { apiToFuture } from "../../utils/futures";
import { NamedRef } from "@eyeseetea/d2-logger/domain/entities/Base";
import { Id } from "../../domain/entities/Ref";

export class DashboardD2Repository implements DashboardRepository {
    constructor(private api: D2Api) {}

    get(options: GetDashboardOptions): FutureData<PaginatedResponse<Dashboard>> {
        return apiToFuture(
            this.api.models.dashboards.get({
                fields: {
                    id: true,
                    displayName: true,
                    displayDescription: true,
                    sharing: { owner: true, users: { id: true, access: true, displayName: true } },
                },
                page: options.page,
                pageSize: options.pageSize,
                order: `${options.sorting.field}:${options.sorting.order}`,
                filter: {
                    name: { like: options.search },
                    description: { like: options.search },
                    "sharing.owner": { in: options.filters.ownerUsersIds },
                },
                rootJunction: "OR",
            })
        ).flatMap(response => {
            const usersOwnersIds = response.objects.map(dashboard => dashboard.sharing.owner);
            return this.getUsersByIds(usersOwnersIds).map(usersOwners => {
                return {
                    objects: this.buildDashboards(response.objects, usersOwners, options.hideUsers ?? []),
                    pager: response.pager,
                };
            });
        });
    }

    private buildDashboards(
        d2Dashboards: D2ApiDashboard[],
        usersOwners: NamedRef[],
        userIdsToExclude: Id[]
    ): Dashboard[] {
        const notAvailableLabel = " - ";
        return d2Dashboards.map(d2Dashboard => {
            const ownerUser = usersOwners.find(user => user.id === d2Dashboard.sharing.owner);
            const usersFromSharing = Object.values(d2Dashboard.sharing.users);
            return Dashboard.create({
                id: d2Dashboard.id,
                name: d2Dashboard.displayName,
                description: d2Dashboard.displayDescription,
                owner: { id: ownerUser?.id ?? notAvailableLabel, name: ownerUser?.name ?? notAvailableLabel },
                users: _(usersFromSharing)
                    .map(user => {
                        if (userIdsToExclude.includes(user.id)) return undefined;

                        return { id: user.id, name: user.displayName ?? notAvailableLabel };
                    })
                    .compact()
                    .value(),
            });
        });
    }

    private getUsersByIds(ids: string[]): FutureData<NamedRef[]> {
        return apiToFuture(
            this.api.models.users.get({
                filter: { id: { in: ids } },
                fields: { id: true, displayName: true },
                paging: false,
            })
        ).map(response => {
            return response.objects.map(user => ({ id: user.id, name: user.displayName }));
        });
    }
}

type D2ApiDashboard = {
    id: Id;
    displayName: string;
    displayDescription: string;
    sharing: { owner: Id; users: Record<Id, { id: Id; access: string; displayName?: string }> };
};
