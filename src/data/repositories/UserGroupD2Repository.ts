import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { Future, FutureData } from "../../domain/entities/Future";
import { PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { UserGroup } from "../../domain/entities/UserGroup";
import { apiToFuture } from "../../utils/futures";
import { GetUsersGroupsOptions, UserGroupRepository } from "../../domain/repositories/UserGroupRepository";
import { Id } from "../../domain/entities/Ref";
import { Maybe } from "../../types/utils";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}

    getAll(): FutureData<UserGroup[]> {
        return apiToFuture(
            this.api.models.userGroups
                .get({ fields: { id: true, displayName: true }, paging: false })
                .map(res =>
                    res.data.objects.map(({ id, displayName }) =>
                        UserGroup.create({ id, name: displayName, description: undefined, users: [] })
                    )
                )
        );
    }

    get(options: GetUsersGroupsOptions): FutureData<PaginatedResponse<UserGroup>> {
        const groupsToHide = options.hideGroups ? options.hideGroups : [];
        return apiToFuture(
            this.api.models.userGroups.get({
                fields: { id: true, displayName: true, users: { id: true, displayName: true } },
                filter: {
                    name: { ilike: options.search },
                    "users.id": { in: options.usersIds ?? undefined },
                    id: { "!in": groupsToHide.length > 0 ? groupsToHide : undefined },
                    users: options.hideEmptyUsers ? { gt: "0" } : undefined,
                },
                rootJunction: "OR",
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
                        description: undefined,
                        users: _(d2Group.users)
                            .map(d2User => {
                                if (options.hideUsers?.includes(d2User.id)) return undefined;
                                return { id: d2User.id, name: d2User.displayName };
                            })
                            .compact()
                            .sortBy(user => user.name)
                            .value(),
                    });
                }),
                pager: response.pager,
            };
        });
    }

    getAllBy(options: {
        hideUsers: Id[];
        hideGroups: Id[];
        descriptionSource: Maybe<string>;
    }): FutureData<UserGroup[]> {
        return this.getAllUserGroups({ initialPage: 1, pageSize: 100 }).map(d2UserGroups => {
            return d2UserGroups
                .filter(group => !options.hideGroups.includes(group.id))
                .map(group => {
                    const filteredUsers = group.users.filter(user => !options.hideUsers.includes(user.id));
                    return UserGroup.create({
                        id: group.id,
                        name: group.displayName,
                        description: getDescription(group, options.descriptionSource),
                        users: filteredUsers.map(user => ({ id: user.id, name: user.displayName })),
                    });
                });
        });
    }

    private getAllUserGroups(options: { initialPage: number; pageSize: number }): FutureData<D2ApiUserGroup[]> {
        const { initialPage, pageSize } = options;

        const fetchByPage = (page: number): FutureData<D2ApiUserGroup[]> => {
            return apiToFuture(
                this.api.models.userGroups.get({
                    fields: {
                        id: true,
                        displayName: true,
                        users: { id: true, displayName: true },
                        attributeValues: { value: true, attribute: { id: true } },
                    },
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

type D2ApiUserGroup = {
    id: string;
    displayName: string;
    users: Array<{
        id: string;
        displayName: string;
    }>;
    attributeValues: Array<{
        value: string;
        attribute: { id: string };
    }>;
};

/* The description source is an opaque handle for the domain: here it is resolved
 * as the id of the metadata attribute holding the description. */
function getDescription(d2UserGroup: D2ApiUserGroup, descriptionSource: Maybe<string>): Maybe<string> {
    if (!descriptionSource) return undefined;

    return d2UserGroup.attributeValues.find(attributeValue => attributeValue.attribute.id === descriptionSource)?.value;
}
