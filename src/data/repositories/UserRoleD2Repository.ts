import _ from "lodash";
import { D2Api, Id } from "../../types/d2-api";
import { Future, FutureData } from "../../domain/entities/Future";
import { PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { UserRole } from "../../domain/entities/UserRole";
import { apiToFuture } from "../../utils/futures";
import { GetUserRolesParams, UserRoleRepository } from "../../domain/repositories/UserRoleRepository";

export class UserRoleD2Repository implements UserRoleRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<UserRole[]> {
        return apiToFuture(
            this.api.models.userRoles
                .get({
                    fields: { id: true, displayName: true, description: true },
                    paging: false,
                })
                .map(res =>
                    res.data.objects.map(({ id, description, displayName }) =>
                        UserRole.create({ id, description, name: displayName, users: [] })
                    )
                )
        );
    }

    get(options: GetUserRolesParams): FutureData<PaginatedResponse<UserRole>> {
        const userIdsToFilters = options.userIds && options.userIds.length > 0 ? options.userIds : undefined;
        return apiToFuture(
            this.api.models.userRoles.get({
                fields: { id: true, description: true, displayName: true, users: { id: true, displayName: true } },
                filter: {
                    name: { ilike: options.search },
                    description: { ilike: options.search },
                    "users.id": { in: userIdsToFilters },
                    id: options.hideRoles && options.hideRoles.length > 0 ? { "!in": options.hideRoles } : undefined,
                    users: options.hideEmptyUsers ? { gt: "0" } : undefined,
                },
                rootJunction: "OR",
                page: options.page,
                pageSize: options.pageSize,
                order: `${options.sorting.field}:${options.sorting.order}`,
            })
        ).map(response => {
            return {
                objects: _(response.objects)
                    .map(d2Role => {
                        return UserRole.create({
                            id: d2Role.id,
                            name: d2Role.displayName,
                            description: d2Role.description,
                            users: _(d2Role.users)
                                .map(d2User => {
                                    if (options.hideUsers?.includes(d2User.id)) return undefined;
                                    return { id: d2User.id, name: d2User.displayName };
                                })
                                .compact()
                                .sortBy(user => user.name)
                                .value(),
                        });
                    })
                    .compact()
                    .value(),
                pager: response.pager,
            };
        });
    }

    getAllBy(options: { hideUsers: Id[]; hideRoles: Id[] }): FutureData<UserRole[]> {
        return this.getAllUserRoles({ initialPage: 1, pageSize: 100 }).map(d2UserRoles => {
            return d2UserRoles
                .filter(role => !options.hideRoles.includes(role.id))
                .map(role => {
                    const filteredUsers = role.users.filter(user => !options.hideUsers.includes(user.id));
                    return UserRole.create({
                        id: role.id,
                        name: role.displayName,
                        description: role.description,
                        users: filteredUsers.map(user => ({ id: user.id, name: user.displayName })),
                    });
                });
        });
    }

    private getAllUserRoles(options: { initialPage: number; pageSize: number }): FutureData<D2ApiUserRole[]> {
        const { initialPage, pageSize } = options;

        const fetchByPage = (page: number): FutureData<D2ApiUserRole[]> => {
            return apiToFuture(
                this.api.models.userRoles.get({
                    fields: { id: true, displayName: true, description: true, users: { id: true, displayName: true } },
                    page,
                    pageSize,
                })
            ).flatMap(response => {
                const userGroups = response.objects;
                if (response.pager.page < response.pager.pageCount) {
                    return fetchByPage(page + 1).map(nextUserGroups => userGroups.concat(nextUserGroups));
                } else {
                    return Future.success(userGroups);
                }
            });
        };

        return fetchByPage(initialPage);
    }
}

type D2ApiUserRole = {
    id: string;
    displayName: string;
    description: string;
    users: Array<{
        id: string;
        displayName: string;
    }>;
};
