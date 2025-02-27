import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/entities/Future";
import { CommonFilterParams, PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { UserRole } from "../../domain/entities/UserRole";
import { apiToFuture } from "../../utils/futures";
import { UserRoleRepository } from "../../domain/repositories/UserRoleRepository";

export class UserRoleD2Repository implements UserRoleRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<UserRole[]> {
        return apiToFuture(
            this.api.models.userRoles
                .get({
                    fields: {
                        id: true,
                        displayName: true,
                        description: true,
                    },
                    paging: false,
                })
                .map(res =>
                    res.data.objects.map(({ id, description, displayName }) =>
                        UserRole.create({ id, description, name: displayName, users: [] })
                    )
                )
        );
    }

    get(options: CommonFilterParams): FutureData<PaginatedResponse<UserRole>> {
        return apiToFuture(
            this.api.models.userRoles.get({
                fields: { id: true, description: true, displayName: true, users: { id: true, displayName: true } },
                filter: { name: { like: options.search }, description: { like: options.search } },
                rootJunction: "OR",
                page: options.page,
                pageSize: options.pageSize,
                order: `${options.sorting.field}:${options.sorting.order}`,
            })
        ).map(response => {
            return {
                objects: response.objects.map(d2Role => {
                    return UserRole.create({
                        id: d2Role.id,
                        name: d2Role.displayName,
                        description: d2Role.description,
                        users: d2Role.users.map(d2User => ({ id: d2User.id, name: d2User.displayName })),
                    });
                }),
                pager: response.pager,
            };
        });
    }
}
