import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { Dashboard } from "../../domain/entities/Dashboard";
import { Future, FutureData } from "../../domain/entities/Future";
import { Pager } from "../../domain/entities/PaginatedResponse";
import { DashboardRepository, GetDashboardOptions } from "../../domain/repositories/DashboardRepository";
import { apiToFuture } from "../../utils/futures";
import { Id } from "../../domain/entities/Ref";
import { Maybe } from "../../types/utils";
import { UserSimple } from "../../domain/entities/UserSimple";
import { chunkRequest } from "../utils";

export class DashboardD2Repository implements DashboardRepository {
    constructor(private api: D2Api) {}

    getAll(options: { hideUsers: Maybe<Id[]>; hideGroups: Maybe<Id[]> }): FutureData<Dashboard[]> {
        return this.getAllDashboards({ initialPage: 1, pageSize: 100 }).flatMap(d2Dashboards => {
            const userGroupsIds = _(
                d2Dashboards.flatMap(dashboard => Object.values(dashboard.sharing.userGroups).map(ug => ug.id))
            )
                .uniq()
                .value();

            return Future.joinObj({
                userGroups: userGroupsIds.length > 0 ? this.getUserGroupsByIds(userGroupsIds) : Future.success([]),
            }).flatMap(({ userGroups }) => {
                const usersOwnersIds = d2Dashboards.map(dashboard => dashboard.sharing.owner);
                const sharingUserIds = d2Dashboards.flatMap(dashboard =>
                    Object.values(dashboard.sharing.users).map(u => u.id)
                );
                const userIdsFromGroups = userGroups.flatMap(ug => ug.users.map(user => user.id));
                const allUserIds = [...usersOwnersIds, ...userIdsFromGroups, ...sharingUserIds];

                return this.getUsersByIds(allUserIds).map(allUsers => {
                    return this.buildDashboards(
                        allUsers,
                        d2Dashboards,
                        userGroups,
                        options.hideUsers ?? [],
                        options.hideGroups ?? []
                    );
                });
            });
        });
    }

    private getAllDashboards(options: { initialPage: number; pageSize: number }): FutureData<D2ApiDashboard[]> {
        const { initialPage, pageSize } = options;

        const fetchByPage = (page: number): FutureData<D2ApiDashboard[]> => {
            return this.getDashboards({
                page,
                pageSize,
                hideGroups: undefined,
                hideUsers: undefined,
                search: "",
                sorting: { field: "name", order: "asc" },
                filters: { ownerUsersIds: undefined },
            }).flatMap(response => {
                const dashboards = response.objects;
                if (response.pager.page < response.pager.pageCount) {
                    return fetchByPage(page + 1).map(nextDashboards => dashboards.concat(nextDashboards));
                } else {
                    return Future.success(dashboards);
                }
            });
        };

        return fetchByPage(initialPage);
    }

    private getDashboards(options: GetDashboardOptions): FutureData<{ objects: D2ApiDashboard[]; pager: Pager }> {
        const ownerIds =
            options.filters.ownerUsersIds && options.filters.ownerUsersIds.length > 0
                ? options.filters.ownerUsersIds
                : undefined;

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
                    name: { ilike: options.search },
                    description: { ilike: options.search },
                    "sharing.owner": { in: ownerIds },
                },
            })
        );
    }

    private getUsersByIds(ids: string[]): FutureData<UserSimple[]> {
        const uniqueIds = _.uniq(ids);
        return chunkRequest(uniqueIds, userIds => {
            return apiToFuture(
                this.api.models.users.get({
                    filter: { id: { in: userIds } },
                    fields: {
                        id: true,
                        firstName: true,
                        displayName: true,
                        username: true,
                        email: true,
                        surname: true,
                    },
                    paging: false,
                })
            ).map(response => {
                return response.objects.map(user =>
                    UserSimple.create({
                        id: user.id,
                        firstName: user.firstName,
                        name: user.displayName,
                        email: user.email,
                        lastName: user.surname,
                        username: user.username,
                    })
                );
            });
        });
    }

    private getUserGroupsByIds(ids: string[]): FutureData<D2ApiUserGroup[]> {
        const uniqueIds = _.uniq(ids);
        return apiToFuture(
            this.api.models.userGroups.get({
                filter: { id: { in: uniqueIds } },
                fields: { id: true, displayName: true, users: { id: true, displayName: true, username: true } },
                paging: false,
            })
        ).map(response => {
            return response.objects;
        });
    }

    private buildDashboards(
        allUsers: UserSimple[],
        d2Dashboards: D2ApiDashboard[],
        userGroups: D2ApiUserGroup[],
        userIdsToExclude: Id[],
        groupIdsToExclude: Id[]
    ): Dashboard[] {
        const allUsersById = new Map(allUsers.map(user => [user.id, user]));
        return d2Dashboards.map(d2Dashboard => {
            const ownerUser = allUsersById.get(d2Dashboard.sharing.owner);

            const sharedUserGroups = Object.values(d2Dashboard.sharing.userGroups)
                .filter(ug => !groupIdsToExclude.includes(ug.id))
                .map(ug => ug.id);

            const users = this.buildUsersFromDashboardAndGroups(
                Object.values(d2Dashboard.sharing.users),
                userGroups.filter(ug => sharedUserGroups.includes(ug.id)),
                allUsersById
            );

            return Dashboard.create({
                id: d2Dashboard.id,
                name: d2Dashboard.displayName,
                description: d2Dashboard.displayDescription ?? "",
                owner: UserSimple.create({
                    id: ownerUser?.id ?? notAvailableLabel,
                    firstName: ownerUser?.firstName ?? notAvailableLabel,
                    name: ownerUser?.name ?? notAvailableLabel,
                    email: ownerUser?.email ?? notAvailableLabel,
                    lastName: ownerUser?.lastName ?? notAvailableLabel,
                    username: ownerUser?.username ?? notAvailableLabel,
                }),
                users: _(users)
                    .filter(user => !userIdsToExclude.includes(user.id))
                    .map(user => UserSimple.create(user))
                    .sortBy(user => user.name)
                    .value(),
            });
        });
    }

    private buildUsersFromDashboardAndGroups(
        users: Array<{ id: Id; displayName?: string; username: string }>,
        userGroups: D2ApiUserGroup[],
        allUsersById: Map<Id, UserSimple>
    ): Dashboard["users"] {
        const usersInGroups = userGroups.flatMap(group =>
            group.users.map(user => ({ ...user, groupNames: [group.displayName] }))
        );

        const usersInDashboard = users.map(user => ({ ...user, groupNames: [] }));

        const allUsers = [...usersInGroups, ...usersInDashboard];

        const groupedById = _(allUsers)
            .groupBy(user => user.id)
            .value();

        return Object.values(groupedById).map(userEntries => {
            const base = userEntries[0];
            const userDetail = allUsersById.get(base.id);
            const groupNames = _.uniq(userEntries.flatMap(u => u.groupNames));

            const userNameToDisplay = base.displayName ? base.displayName : notAvailableLabel;

            const displayName =
                groupNames.length > 0 ? `${userNameToDisplay} (${groupNames.join(", ")})` : userNameToDisplay;

            return UserSimple.create({
                id: base.id,
                name: displayName,
                email: userDetail?.email ?? "",
                lastName: userDetail?.lastName ?? "",
                username: userDetail?.username ?? "",
                firstName: userDetail?.firstName ?? "",
            });
        });
    }
}

export type D2ApiDashboard = {
    id: Id;
    displayName: string;
    displayDescription: string;
    sharing: {
        owner: Id;
        users: Record<Id, { id: Id; access: string; displayName?: string; username: string }>;
        userGroups: Record<Id, { id: Id; access: string; displayName?: string; username: string }>;
    };
};

type D2ApiUserGroup = {
    id: Id;
    displayName: string;
    users: Array<{ id: Id; displayName?: string; username: string }>;
};

const notAvailableLabel = " - ";
