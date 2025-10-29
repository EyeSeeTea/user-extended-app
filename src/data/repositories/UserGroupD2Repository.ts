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
                .get({ fields: { id: true, displayName: true }, paging: false })
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
                filter: {
                    name: { ilike: options.search },
                    "users.id": { in: options.usersIds ?? undefined },
                    id: { "!in": options.hideGroups ?? undefined },
                },
                page: options.page,
                pageSize: options.pageSize,
                order: `${options.sorting.field}:${options.sorting.order}`,
            })
        ).map(response => {
            return {
                objects: response.objects.map(d2Group => {
                    return UserGroup.create({
                        id: d2Group.id,
                        name: d2Group.displayName,
                        users: _(d2Group.users)
                            .map(d2User => {
                                if (options.hideUsers?.includes(d2User.id)) return undefined;
                                return { id: d2User.id, name: d2User.displayName };
                            })
                            .compact()
                            .value(),
                    });
                }),
                pager: response.pager,
            };
        });
    }
}
