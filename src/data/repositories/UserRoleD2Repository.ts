import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/entities/Future";
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
}
