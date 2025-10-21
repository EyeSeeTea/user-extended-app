import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { Dashboard } from "../../domain/entities/Dashboard";
import { Future, FutureData } from "../../domain/entities/Future";
import { Pager, PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { DashboardRepository, GetDashboardOptions } from "../../domain/repositories/DashboardRepository";
import { apiToFuture } from "../../utils/futures";
import { NamedRef } from "@eyeseetea/d2-logger/domain/entities/Base";
import { Id } from "../../domain/entities/Ref";

export class DashboardD2Repository implements DashboardRepository {
    constructor(private api: D2Api) {}

    get(options: GetDashboardOptions): FutureData<PaginatedResponse<Dashboard>> {
        return this.getDashboards(options).flatMap(response => {
            const usersOwnersIds = response.objects.map(dashboard => dashboard.sharing.owner);
            const dashboards = response.objects;
            const userGroupsIds = _(
                dashboards.flatMap(dashboard => Object.values(dashboard.sharing.userGroups).map(ug => ug.id))
            )
                .uniq()
                .value();

            return Future.joinObj({
                usersOwners: this.getUsersByIds(usersOwnersIds),
                userGroups: userGroupsIds.length > 0 ? this.getUserGroupsByIds(userGroupsIds) : Future.success([]),
            }).map(({ usersOwners, userGroups }) => {
                return {
                    objects: this.buildDashboards(dashboards, usersOwners, userGroups, options.hideUsers ?? []),
                    pager: response.pager,
                };
            });
        });
    }

    private getDashboards(options: GetDashboardOptions): FutureData<{ objects: D2ApiDashboard[]; pager: Pager }> {
        return apiToFuture(
            this.api.models.dashboards.get({
                fields: {
                    id: true,
                    displayName: true,
                    displayDescription: true,
                    sharing: {
                        owner: true,
                        users: { id: true, access: true, displayName: true },
                        userGroups: {
                            id: true,
                            access: true,
                            displayName: true,
                        },
                    },
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
        );
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

    private getUserGroupsByIds(ids: string[]): FutureData<D2ApiUserGroup[]> {
        return apiToFuture(
            this.api.models.userGroups.get({
                filter: { id: { in: ids } },
                fields: { id: true, displayName: true, users: { id: true, displayName: true } },
                paging: false,
            })
        ).map(response => {
            return response.objects;
        });
    }

    private buildDashboards(
        d2Dashboards: D2ApiDashboard[],
        usersOwners: NamedRef[],
        userGroups: D2ApiUserGroup[],
        userIdsToExclude: Id[]
    ): Dashboard[] {
        const notAvailableLabel = " - ";

        return d2Dashboards.map(d2Dashboard => {
            const ownerUser = usersOwners.find(user => user.id === d2Dashboard.sharing.owner);

            const sharedUserGroups = Object.values(d2Dashboard.sharing.userGroups).map(ug => ug.id);

            const usersFromUserGroups = userGroups
                .filter(userGroup => sharedUserGroups.includes(userGroup.id))
                .map(userGroup =>
                    userGroup.users.map(user => ({
                        id: user.id,
                        displayName: user.displayName
                            ? `${user.displayName} (${userGroup.displayName})`
                            : notAvailableLabel,
                    }))
                )
                .flat();

            return Dashboard.create({
                id: d2Dashboard.id,
                name: d2Dashboard.displayName,
                description: d2Dashboard.displayDescription,
                owner: { id: ownerUser?.id ?? notAvailableLabel, name: ownerUser?.name ?? notAvailableLabel },
                users: [...Object.values(d2Dashboard.sharing.users), ...usersFromUserGroups]
                    .filter(user => !userIdsToExclude.includes(user.id))
                    .map(user => ({
                        id: user.id,
                        name: user.displayName ?? notAvailableLabel,
                    })),
            });
        });
    }
}

type D2ApiDashboard = {
    id: Id;
    displayName: string;
    displayDescription: string;
    sharing: {
        owner: Id;
        users: Record<Id, { id: Id; access: string; displayName?: string }>;
        userGroups: Record<Id, { id: Id; access: string; displayName?: string }>;
    };
};

type D2ApiUserGroup = {
    id: Id;
    displayName: string;
    users: Array<{ id: Id; displayName?: string }>;
};
