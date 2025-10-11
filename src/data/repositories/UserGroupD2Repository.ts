import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/entities/Future";
import { PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { UserGroup } from "../../domain/entities/UserGroup";
import { apiToFuture } from "../../utils/futures";
import { GetUsersGroupsOptions, UserGroupRepository } from "../../domain/repositories/UserGroupRepository";

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
                .map(res =>
                    res.data.objects.map(({ id, displayName }) =>
                        UserGroup.create({ id, name: displayName, users: [] })
                    )
                )
        );
    }

    get(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>> {
        return apiToFuture(
            this.api.models.userGroups.get({
                fields: { id: true, displayName: true, users: { id: true, displayName: true } },
                filter: { name: { like: options.search }, "users.id": { in: options.usersIds } },
                rootJunction: "OR",
                page: options.page,
                pageSize: options.pageSize,
                order: `${options.sorting.field}:${options.sorting.order}`,
            })
        ).map(response => {
            return {
                objects: response.objects.map(d2Role => {
                    return UserGroup.create({
                        id: d2Role.id,
                        name: d2Role.displayName,
                        users: _(d2Role.users)
                            .map(d2User => ({ id: d2User.id, name: d2User.displayName }))
                            .orderBy(u => u.name)
                            .value(),
                    });
                }),
                pager: response.pager,
            };
        });
    }
}
