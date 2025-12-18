import { D2Api, D2UserSchema, MetadataResponse, SelectedPick } from "../../types/d2-api";
import _ from "lodash";
import { Future, FutureData } from "../../domain/entities/Future";
import { OrgUnit } from "../../domain/entities/OrgUnit";
import { PaginatedResponse } from "../../domain/entities/PaginatedResponse";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { Stats } from "../../domain/entities/Stats";
import { User } from "../../domain/entities/User";
import { ListFilters, ListOptions, UpdateStrategy, UserRepository } from "../../domain/repositories/UserRepository";
import { LocaleCode } from "../../domain/entities/UserProps";
import { UserIdentifier } from "../../domain/entities/UserIdentifier";
import { Maybe } from "../../types/utils";
import { cache } from "../../utils/cache";
import { getD2APiFromInstance, joinPaths } from "../../utils/d2-api";
import { apiToFuture } from "../../utils/futures";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { D2ApiLogger, D2LoggerMessage } from "../D2ApiLogger";
import { Instance } from "../entities/Instance";
import { ApiD2OrgUnit } from "../models/DHIS2Model";
import { ApiUserModel } from "../models/UserModel";
import { buildUserWithoutPassword, chunkRequest, getErrorFromResponse } from "../utils";
import { Codec, exactly, string } from "purify-ts";
import i18n from "../../utils/i18n";
import { getLanguage } from "../../domain/utils/getLanguage";
import { validationErrorsToString } from "../../domain/utils/validationErrorsToString";
import { GET_USERS_BY_IDS_CHUNK_SIZE, LIST_ALL_USERS_PAGE_SIZE } from "../../domain/utils/limits";

export class UserD2ApiRepository implements UserRepository {
    private api: D2Api;
    private userStorage: StorageClient;

    constructor(instance: Instance) {
        this.api = getD2APiFromInstance(instance);
        this.userStorage = new DataStoreStorageClient("user", instance);
    }

    // TODO: this method should be in a different use case
    // retrieve users, update them
    private getLocales(users: User[]): FutureData<User[]> {
        const $requests = users.map((user): FutureData<User> => {
            return apiToFuture(
                this.api.request<D2UserSettings>({
                    method: "get",
                    url: "/userSettings.json",
                    params: { user: user.username },
                })
            ).map((response): User => {
                const userResult = User.createExisted({
                    ...user,
                    uiLocale: response.keyUiLocale,
                    dbLocale: response.keyDbLocale,
                });

                return userResult.match({
                    success: user => {
                        return user;
                    },
                    error: errors => {
                        throw new Error(
                            `Error setting locales for user ${user.id}: ${validationErrorsToString(errors)}`
                        );
                    },
                });
            });
        });

        return Future.parallel($requests, { maxConcurrency: 5 }).map(users => users);
    }

    private saveLocales(users: User[]): FutureData<void> {
        const $requests = users.flatMap(user => {
            return [this.saveLocaleRequest(user, "keyDbLocale"), this.saveLocaleRequest(user, "keyUiLocale")];
        });
        return Future.parallel($requests, { maxConcurrency: 2 }).map(() => undefined);
    }

    private saveLocaleRequest(user: User, keyLocale: KeyLocale): FutureData<void> {
        return apiToFuture(
            this.api.request({
                method: "post",
                url: `/userSettings/${keyLocale}.json`,
                params: { user: user.username, value: this.getLocaleValueByType(user, keyLocale) },
            })
        );
    }

    private getLocaleValueByType(user: User, keyLocale: KeyLocale): string {
        switch (keyLocale) {
            case DB_LOCALE_KEY:
                return getLanguage(user.dbLocale);
            case UI_LOCALE_KEY:
                return getLanguage(user.uiLocale);
        }
    }

    remove(ids: Id[]): FutureData<Stats> {
        return chunkRequest(ids, userIds => {
            return apiToFuture<Dhis2Response>(
                this.api.metadata.post({ users: userIds.map(id => ({ id: id })) }, { importStrategy: "DELETE" })
            ).flatMap(d2Response => {
                const res = d2Response.response ? d2Response.response : d2Response;
                return Future.success([
                    new Stats({
                        created: res.stats.created,
                        updated: res.stats.updated,
                        ignored: res.stats.ignored,
                        deleted: res.stats.deleted,
                        errorMessage: getErrorFromResponse(res.typeReports),
                    }),
                ]);
            });
        }).flatMap(stats => {
            return Future.success(Stats.combine(stats));
        });
    }

    resetPasswords(users: User[]): FutureData<Stats> {
        const $requests = users.map(user => apiToFuture(this.api.post(`/users/${user.id}/reset`)));

        return Future.parallel($requests, { maxConcurrency: 5 }).map(() => Stats.empty()); // There is no response body from the API
    }

    @cache()
    public getCurrent(): FutureData<User> {
        return apiToFuture(
            this.api.currentUser.get({
                fields: { ...fields, organisationUnits: { ...fields.organisationUnits, level: true } },
            })
        ).map(user => this.toDomainUser(user));
    }

    public list(options: ListOptions): FutureData<PaginatedResponse<User>> {
        const { page, pageSize } = options;

        return this.getUsersIdsInChunks(options.hideUsers).flatMap(usersIdsToHide => {
            return apiToFuture(
                this.api.models.users.get({
                    fields: {
                        ...fields,
                        ...auditFields,
                        userCredentials: { ...fields.userCredentials, ...auditFields },
                    },
                    page,
                    pageSize,
                    ...this.createCommonListQueryParams(options),
                })
            ).map(({ objects, pager }) => {
                const users = objects.map(user => this.toDomainUser(user));
                const excludeHiddenUsers = usersIdsToHide
                    ? users.filter(user => !usersIdsToHide.includes(user.id))
                    : users;
                return { pager, objects: excludeHiddenUsers };
            });
        });
    }

    verifyPassword(password: string): FutureData<true> {
        return apiToFuture(
            this.api.post<typeof verifyPasswordResponseCodec>(`/account/validatePassword?password=${password}`)
        ).flatMap(data => {
            return verifyPasswordResponseCodec.decode(data).caseOf<FutureData<true>>({
                Left: () => Future.error(i18n.t("Invalid response from server")),
                Right: data => {
                    if (data.response === "error") {
                        return Future.error(data.message || i18n.t("Unknown error"));
                    } else {
                        return Future.success(true);
                    }
                },
            });
        });
    }

    private buildFilters(
        filters: ListFilters | undefined,
        override: { onlyActiveUsers: boolean }
    ): Record<string, Record<string, string[]> | undefined> {
        const otherFilters = _.mapValues(filters, items => (items ? { [items[0]]: items[1] } : undefined));

        return {
            ...otherFilters,
            "userCredentials.disabled": override.onlyActiveUsers
                ? { eq: ["false"] }
                : otherFilters["userCredentials.disabled"],
        };
    }

    private getUsersIdsInChunks(ids: Id[]): FutureData<Maybe<Id[]>> {
        if (ids.length === 0) return Future.success(undefined);
        return chunkRequest(ids, usersIds => {
            return apiToFuture(
                this.api.models.users.get({
                    fields: { id: true },
                    filter: { id: { in: usersIds } },
                    paging: false,
                })
            ).map(d2Response => {
                return d2Response.objects.map(d2User => d2User.id);
            });
        });
    }

    public listAllIds(options: ListOptions): FutureData<string[]> {
        return this.getUsersIdsInChunks(options.hideUsers).flatMap(usersIdsToExclude => {
            return apiToFuture(
                this.api.models.users.get({
                    fields: { id: true },
                    paging: false,
                    ...this.createCommonListQueryParams(options),
                })
            ).map(({ objects }) => {
                const usersIds = objects.map(user => user.id);
                return usersIdsToExclude ? usersIds.filter(id => !usersIdsToExclude.includes(id)) : usersIds;
            });
        });
    }

    private createCommonListQueryParams(options: ListOptions) {
        const {
            search,
            sorting = { field: "firstName", order: "asc" },
            filters,
            canManage,
            rootJunction,
            onlyActiveUsers,
            onlyUsersOrgUnits,
        } = options;

        const otherFilters = this.buildFilters(filters, { onlyActiveUsers });
        const areFiltersEnabled = _(otherFilters).values().some();
        const sortingField = sorting.field === "status" ? "disabled" : sorting.field;

        return {
            query: search !== "" ? search : undefined,
            canManage: canManage === "true" ? "true" : undefined,
            filter: otherFilters,
            rootJunction: areFiltersEnabled ? rootJunction : undefined,
            userOrgUnits: onlyUsersOrgUnits ? "true" : undefined,
            includeChildren: onlyUsersOrgUnits ? "true" : undefined,
            order: `${sortingField}:${sorting.order}`,
        };
    }

    public listAllUserIdentifiers(options: ListOptions): FutureData<UserIdentifier[]> {
        return this.getUsersIdsInChunks(options.hideUsers).flatMap(usersIdsToExclude => {
            return apiToFuture(
                this.api.models.users.get({
                    fields: { id: true, userCredentials: { username: true } },
                    paging: false,
                    ...this.createCommonListQueryParams(options),
                })
            ).map(({ objects }) => {
                const filteredObjects = usersIdsToExclude
                    ? objects.filter(user => !usersIdsToExclude.includes(user.id))
                    : objects;
                return filteredObjects.map(
                    user => new UserIdentifier({ id: user.id, username: user.userCredentials.username })
                );
            });
        });
    }

    public getByIds(ids: Id[]): FutureData<User[]> {
        if (ids.length === 0) return Future.success([]);
        return this.getUsersByIds(ids);
    }

    private getUsersByIds(ids: Id[]): FutureData<User[]> {
        const $requests = chunkRequest(
            ids,
            usersIds => {
                return apiToFuture(
                    this.api.models.users.get({
                        paging: false,
                        fields: {
                            ...fields,
                            ...auditFields,
                            userCredentials: { ...fields.userCredentials, ...auditFields },
                        },
                        filter: { id: { in: usersIds } },
                        v: +new Date().getTime(),
                    })
                ).flatMap(({ objects }) => {
                    const users = objects.map(user => this.toDomainUser(user));
                    return this.getUsersGroups(usersIds).flatMap(d2UsersWithGroups => {
                        const usersWithGroups = this.addGroupsToUsers(users, d2UsersWithGroups);
                        return this.getLocales(usersWithGroups);
                    });
                });
            },
            GET_USERS_BY_IDS_CHUNK_SIZE
        );

        return $requests.map(_.flatten);
    }

    private addGroupsToUsers(users: User[], d2UsersWithGroups: D2UserGroupByKey): User[] {
        return users.map((user): User => {
            const userGroups = d2UsersWithGroups[user.id] || [];

            const userResult = User.createExisted({ ...user, userGroups: userGroups });

            return userResult.match({
                success: user => {
                    return user;
                },
                error: errors => {
                    throw new Error(`Error adding groups to user ${user.id}: ${validationErrorsToString(errors)}`);
                },
            });
        });
    }

    private getUsersGroups(usersIds: Id[]): FutureData<D2UserGroupByKey> {
        const $requests = chunkRequest(usersIds, usersChunksIds => {
            return apiToFuture(
                this.api.models.userGroups.get({
                    filter: { "users.id": { in: usersChunksIds } },
                    fields: { id: true, displayName: true, users: true },
                    paging: false,
                })
            ).map(response => {
                return response.objects.map(d2Group => ({
                    id: d2Group.id,
                    name: d2Group.displayName,
                    users: d2Group.users,
                }));
            });
        });

        return $requests.map(d2UsersGroups => {
            const userGroups = _(d2UsersGroups)
                .flatMap(group => group.users.map(user => ({ userId: user.id, group })))
                .value();

            const groupedByUser = _(userGroups)
                .groupBy(ug => ug.userId)
                .mapValues(groups => groups.map(group => _.omit(group.group, ["users"])))
                .value();

            return groupedByUser;
        });
    }

    private getFullUsers(options: ListOptions): FutureData<ApiUser[]> {
        const {
            page,
            pageSize,
            search,
            sorting = { field: "firstName", order: "asc" },
            filters,
            onlyActiveUsers,
        } = options;

        const otherFilters = this.buildFilters(filters, { onlyActiveUsers });

        const userData$ = apiToFuture(
            this.api.models.users.get({
                fields: {
                    ...fields,
                    $owner: true,
                    userCredentials: { ...fields.userCredentials, $all: true },
                },
                page,
                pageSize,
                paging: false,
                filter: {
                    identifiable: search ? { token: search } : undefined,
                    ...otherFilters,
                },
                order: `${sorting.field}:${sorting.order}`,
                v: +new Date().getTime(),
            })
        );
        return userData$.flatMap(({ objects }) => {
            return this.getUsersGroups(objects.map(user => user.id)).map(d2UsersGroups => {
                const users = objects.map(user => {
                    const userGroups = d2UsersGroups[user.id] || [];
                    return { ...user, userGroups };
                });
                return users;
            });
        });
    }

    public listAll(
        options: ListOptions,
        state: { initialPage: number; users: User[] } = { initialPage: 1, users: [] }
    ): FutureData<User[]> {
        const { initialPage, users } = state;
        return this.list({ ...options, pageSize: LIST_ALL_USERS_PAGE_SIZE, page: initialPage }).flatMap(
            ({ pager, objects }) => {
                const newUsers = [...users, ...objects];
                if (pager.page >= pager.pageCount) {
                    return Future.success(newUsers);
                } else {
                    return this.listAll(options, {
                        initialPage: initialPage + 1,
                        users: newUsers,
                    });
                }
            }
        );
    }

    public save(usersToSave: User[]): FutureData<MetadataResponse> {
        const validations = usersToSave.map(user => ApiUserModel.decode(this.toApiUser(user)));
        const users = _.compact(validations.map(either => either.toMaybe().extract()));
        const errors = _.compact(validations.map(either => either.leftOrDefault("")));

        if (errors.length > 0) {
            return Future.error(errors.join("\n"));
        }

        const userIds = users.map(user => user.id);

        return this.getLogger().flatMap(logger => {
            return this.getFullUsers({
                filters: { id: ["in", userIds] },
                onlyUsersOrgUnits: false,
                onlyActiveUsers: false,
                hideUsers: [],
            }).flatMap(existingUsers => {
                const usersToSend = _(userIds)
                    .map(userId => {
                        const existingUser = existingUsers.find(user => user.id === userId);
                        const user = users.find(user => user.id === userId);
                        if (!user) return undefined;
                        return this.buildUsersToSave(existingUser, user);
                    })
                    .compact()
                    .value();

                logger?.log({ users: buildUserWithoutPassword(usersToSend as ApiUser[]) });
                return apiToFuture(this.api.metadata.post({ users: usersToSend }))
                    .flatMap(data => {
                        return Future.joinObj({
                            saveLocales: this.saveLocales(usersToSave),
                            saveGroupsStats: this.updateUserGroups(users, existingUsers, logger),
                        }).map(() => {
                            logger?.log(data);
                            return data;
                        });
                    })
                    .flatMapError(error => {
                        logger?.log({ error: error });
                        return Future.error(error);
                    });
            });
        });
    }

    public saveInChunks(users: User[], chunkSize: number): FutureData<void> {
        const requests = _.chunk(users, chunkSize).map(usersChunk => this.save(usersChunk));
        return Future.sequential(requests).toVoid();
    }

    private getLogger(): FutureData<Maybe<D2LoggerMessage>> {
        return this.getCurrent().flatMap(currentUser => {
            const d2ApiTracker = new D2ApiLogger(this.api);
            return d2ApiTracker.buildLogger(currentUser);
        });
    }

    private buildUsersToSave(existingUser: Maybe<ApiUser>, user: ApiUser) {
        return {
            ...(existingUser || {}),
            ...user,
            // include these fields here and in userCredentials due to a bug in v2.38
            userRoles: user.userCredentials.userRoles,
            username: user.userCredentials.username,
            disabled: user.userCredentials.disabled,
            openId: user.userCredentials.openId,
            password: user.userCredentials.password,
            userCredentials: {
                ...(existingUser || {}).userCredentials,
                ...user.userCredentials,
                id: user.id,
                accountExpiry: user.userCredentials.accountExpiry ? user.userCredentials.accountExpiry : undefined,
            },
        };
    }

    //TODO: this method should be an use case or part of a existed use case because contains application business rules
    // retrieve users, update them and save them again
    public updateRoles(ids: Id[], update: NamedRef[], strategy: UpdateStrategy): FutureData<MetadataResponse> {
        return this.getByIds(ids).flatMap(storedUsers => {
            const commonRoles = _.intersectionBy(
                ...storedUsers.map(user => user.userRoles.map(role => role)),
                ({ id }) => id
            );

            const users = storedUsers.map(user => {
                const userResult = User.createExisted({
                    ...user,
                    userRoles:
                        strategy === "merge"
                            ? _.uniqBy(
                                  [..._.differenceBy(user.userRoles, commonRoles, ({ id }) => id), ...update],
                                  ({ id }) => id
                              )
                            : update,
                });

                return userResult.match({
                    success: user => {
                        return user;
                    },
                    error: errors => {
                        throw new Error(
                            `Error updating roles for user ${user.id}: ${validationErrorsToString(errors)}`
                        );
                    },
                });
            });

            return this.save(users);
        });
    }

    //TODO: this method should be an use case or part of a existed use case because contains application business rules
    // retrieve users, update them and save them again
    public updateGroups(ids: Id[], update: NamedRef[], strategy: UpdateStrategy): FutureData<MetadataResponse> {
        return this.getByIds(ids).flatMap(storedUsers => {
            const commonGroups = _.intersectionBy(
                ...storedUsers.map(user => user.userGroups.map(group => group)),
                ({ id }) => id
            );

            const users = storedUsers.map(user => {
                const userResult = User.createExisted({
                    ...user,
                    userGroups:
                        strategy === "merge"
                            ? _.uniqBy(
                                  [..._.differenceBy(user.userGroups, commonGroups, ({ id }) => id), ...update],
                                  ({ id }) => id
                              )
                            : update,
                });

                return userResult.match({
                    success: user => {
                        return user;
                    },
                    error: errors => {
                        throw new Error(`Error creating user ${user.id}: ${validationErrorsToString(errors)}`);
                    },
                });
            });

            return this.save(users);
        });
    }

    public getColumns(): FutureData<Array<keyof User>> {
        const $request = this.userStorage.getOrCreateObject<Array<keyof User>>(
            Namespaces.VISIBLE_COLUMNS,
            defaultColumns
        );
        return $request.map(columns => {
            const result = columns.length ? columns : defaultColumns;
            return result;
        });
    }

    public saveColumns(columns: Array<keyof User>): FutureData<void> {
        return this.userStorage.saveObject<Array<keyof User>>(Namespaces.VISIBLE_COLUMNS, columns);
    }

    updateUserGroups(users: ApiUser[], existing: ApiUser[], logger: Maybe<D2LoggerMessage>): FutureData<Stats> {
        const allUsersGroups = this.buildUsersByGroupId(users);
        const allExistingUsersGroups = this.buildUsersByGroupId(existing);

        const existingKeys = _(allExistingUsersGroups).keys().value();

        const groupsIdsToAddRef = users.flatMap(user => {
            const groupsRef = user.userGroups.map(userGroup => ({ id: userGroup.id }));
            return groupsRef.filter(({ id }) => !existingKeys.includes(id));
        });

        const groupsIdsToAdd = _.uniqBy(groupsIdsToAddRef, ({ id }) => id);

        const groupsIdsToDelete = users.flatMap(user => {
            const existingUser = existing.find(({ id }) => id === user.id);
            const difference = _.differenceWith(
                existingUser?.userGroups,
                user.userGroups,
                (user1, user2) => user1.id === user2.id
            );
            return difference.map(userGroup => ({ id: userGroup.id }));
        });

        const $requestsToAdd = this.buildRequestsGroups(groupsIdsToAdd, allUsersGroups, "add");
        const $requestsToDelete = this.buildRequestsGroups(groupsIdsToDelete, allExistingUsersGroups, "delete");

        return Future.sequential([...$requestsToAdd, ...$requestsToDelete]).map(stats => {
            logger?.log({ groupsIdsToAdd: groupsIdsToAdd, groupsIdsToDelete: groupsIdsToDelete });
            return Stats.combine(stats);
        });
    }

    private buildRequestsGroups(
        groups: Array<{ id: Id }>,
        allUsersGroups: D2UserGroupByKey,
        action: D2ActionGroup
    ): FutureData<Stats>[] {
        return _(groups)
            .map(group => {
                const users = allUsersGroups[group.id] || [];
                if (users.length === 0) return undefined;
                const userGroup = { id: group.id, users: users.map(({ id }) => ({ id })) };
                return this.buildGroupsToSave(userGroup, action);
            })
            .compact()
            .value();
    }

    private buildUsersByGroupId(users: ApiUser[]): D2UserGroupByKey {
        return _(users)
            .flatMap(user =>
                user.userGroups.map(group => ({
                    groupId: group.id,
                    user: user,
                }))
            )
            .groupBy(x => x.groupId)
            .mapValues(groupUsers => groupUsers.map(groupUser => groupUser.user))
            .value();
    }

    private buildGroupsToSave(
        userGroup: { id: Id; users: Array<{ id: Id }> },
        action: D2ActionGroup
    ): FutureData<Stats> {
        const isAdding = action === "add";
        const usersIds = userGroup.users.map(({ id }) => ({ id: id }));
        return apiToFuture(
            this.api.request<Dhis2Response>({
                method: "post",
                url: `/userGroups/${userGroup.id}/users`,
                data: isAdding ? { additions: usersIds } : { deletions: usersIds },
            })
        ).flatMap(d2Response => {
            const response = d2Response.response ? d2Response.response : d2Response;
            const errorMessage = getErrorFromResponse(response.typeReports);
            if (response.status === "ERROR") return Future.error(errorMessage);
            return Future.success(new Stats({ ...response.stats, errorMessage: errorMessage }));
        });
    }

    private toDomainUser(input: ApiUserWithAudit): User {
        const { userCredentials, ...user } = input;
        const authorities = _(userCredentials.userRoles)
            .map(userRole => userRole.authorities)
            .flatten()
            .uniq()
            .value();

        const userResult = User.createExisted({
            id: user.id,
            name: user.name,
            firstName: user.firstName,
            surname: user.surname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            whatsApp: user.whatsApp,
            facebookMessenger: user.facebookMessenger,
            skype: user.skype,
            telegram: user.telegram,
            twitter: user.twitter,
            lastUpdated: new Date(user.lastUpdated),
            created: new Date(user.created),
            userGroups: _(user.userGroups)
                .orderBy(ug => ug.name)
                .value(),
            username: userCredentials.username,
            apiUrl: `${this.api.baseUrl}/api/users/${user.id}.json`,
            userRoles:
                _(userCredentials.userRoles)
                    .map(userRole => ({ id: userRole.id, name: userRole.name }))
                    .orderBy(ur => ur.name)
                    .value() || [],
            lastLogin: userCredentials.lastLogin ? new Date(userCredentials.lastLogin) : undefined,
            status: userCredentials.disabled ? "Disabled" : "Active",
            disabled: userCredentials.disabled,
            organisationUnits: this.getDomainOrgUnits(user.organisationUnits),
            dataViewOrganisationUnits: this.getDomainOrgUnits(user.dataViewOrganisationUnits),
            searchOrganisationsUnits: this.getDomainOrgUnits(user.teiSearchOrganisationUnits),
            access: user.access,
            openId: userCredentials.openId,
            ldapId: userCredentials.ldapId,
            externalAuth: userCredentials.externalAuth,
            twoFactorEnabled: userCredentials.twoFA,
            password: userCredentials.password,
            accountExpiry: userCredentials.accountExpiry,
            authorities,
            dbLocale: "",
            uiLocale: "",
            ...this.getUserAuditFields(input),
        });

        return userResult.match({
            success: user => {
                return user;
            },
            error: errors => {
                throw new Error(`Error processing user ${user.id}: ${validationErrorsToString(errors)}`);
            },
        });
    }

    private getUserAuditFields(user: ApiUserWithAudit): Pick<User, "createdBy" | "lastModifiedBy"> {
        const createdBy = user.userCredentials.createdBy || user.createdBy;
        const lastUpdatedBy = user.userCredentials.lastUpdatedBy || user.lastUpdatedBy;
        return {
            createdBy: createdBy ? { id: createdBy.id, username: createdBy.displayName } : undefined,
            lastModifiedBy: lastUpdatedBy ? { id: lastUpdatedBy?.id, username: lastUpdatedBy?.displayName } : undefined,
        };
    }

    private toApiUser(input: User): ApiUserWithAudit {
        return {
            id: input.id,
            name: input.name,
            firstName: input.firstName,
            surname: input.surname,
            email: input.email,
            phoneNumber: input.phoneNumber,
            whatsApp: input.whatsApp,
            facebookMessenger: input.facebookMessenger,
            skype: input.skype,
            telegram: input.telegram,
            twitter: input.twitter,
            lastUpdated: input.lastUpdated.toISOString(),
            created: input.created.toISOString(),
            userGroups: input.userGroups,
            organisationUnits: this.getApiOrgUnits(input.organisationUnits),
            dataViewOrganisationUnits: this.getApiOrgUnits(input.dataViewOrganisationUnits),
            teiSearchOrganisationUnits: this.getApiOrgUnits(input.searchOrganisationsUnits),
            access: input.access,
            userCredentials: {
                id: input.id,
                username: input.username,
                userRoles: input.userRoles.map(userRole => ({ id: userRole.id, name: userRole.name, authorities: [] })),
                lastLogin: input.lastLogin?.toISOString() ?? "",
                disabled: input.disabled,
                openId: input.openId ?? "",
                ldapId: input.ldapId ?? "",
                externalAuth: input.externalAuth ?? "",
                password: input.password ?? "",
                accountExpiry: input.accountExpiry ?? "",
                twoFA: input.twoFactorEnabled ?? false,
                ...this.getApiAuditFields(input),
            },
            ...this.getApiAuditFields(input),
        };
    }

    private getApiAuditFields(user: User): D2UserAudit {
        return {
            createdBy: user.createdBy ? { id: user.createdBy.id, displayName: user.createdBy.username } : undefined,
            lastUpdatedBy: user.lastModifiedBy
                ? {
                      id: user.lastModifiedBy.id,
                      displayName: user.lastModifiedBy.username,
                  }
                : undefined,
        };
    }

    private getDomainOrgUnits(d2OrgUnits: ApiD2OrgUnit[]): OrgUnit[] {
        return d2OrgUnits.map(d2OrgUnit => ({
            ...d2OrgUnit,
            path: d2OrgUnit.path.split("/").slice(1),
        }));
    }

    private getApiOrgUnits(orgUnits: OrgUnit[]): ApiD2OrgUnit[] {
        return _.compact(
            orgUnits.map(orgUnit => {
                return orgUnit.id === "" ? undefined : { ...orgUnit, path: joinPaths(orgUnit) };
            })
        );
    }

    public getInMyOrgUnit(): FutureData<UserIdentifier[]> {
        return apiToFuture(
            this.api.models.users.get({
                fields: { id: true, displayName: true },
                paging: false,
                userOrgUnits: "true",
                includeChildren: "true",
            })
        ).map(({ objects }) => {
            return objects.map(user => new UserIdentifier({ id: user.id, username: user.displayName }));
        });
    }
}

const verifyPasswordResponseCodec = Codec.interface({
    response: exactly("success", "error"),
    message: string,
});

const orgUnitsFields = { id: true, name: true, code: true, path: true } as const;

const auditFields = {
    createdBy: { id: true, displayName: true },
    lastUpdatedBy: { id: true, displayName: true },
};

const fields = {
    id: true,
    name: true,
    firstName: true,
    surname: true,
    email: true,
    phoneNumber: true,
    whatsApp: true,
    facebookMessenger: true,
    skype: true,
    telegram: true,
    twitter: true,
    lastUpdated: true,
    created: true,
    userGroups: { id: true, name: true },
    organisationUnits: orgUnitsFields,
    dataViewOrganisationUnits: orgUnitsFields,
    teiSearchOrganisationUnits: orgUnitsFields,
    access: {
        manage: true,
        externalize: true,
        write: true,
        read: true,
        update: true,
        delete: true,
    },
    userCredentials: {
        id: true,
        username: true,
        userRoles: { id: true, name: true, authorities: true },
        lastLogin: true,
        disabled: true,
        twoFA: true,
        openId: true,
        ldapId: true,
        externalAuth: true,
        password: true,
        accountExpiry: true,
    },
} as const;

export type ApiUser = SelectedPick<D2UserSchema, typeof fields>;
export type ApiUserWithAudit = ApiUser & { userCredentials: ApiUser["userCredentials"] & D2UserAudit } & D2UserAudit;

export const defaultColumns: Array<keyof User> = [
    "username",
    "firstName",
    "surname",
    "email",
    "organisationUnits",
    "lastLogin",
    "disabled",
];

// in version 2.38 stats and typeReports are inside a response object
type Dhis2Response = MetadataResponse & {
    response?: {
        status: MetadataResponse["status"];
        stats: MetadataResponse["stats"];
        typeReports: MetadataResponse["typeReports"];
    };
};

type D2UserAudit = {
    createdBy?: { id: string; displayName: string };
    lastUpdatedBy?: { id: string; displayName: string };
};

type D2UserSettings = { keyDbLocale: LocaleCode; keyUiLocale: LocaleCode };
type KeyLocale = "keyUiLocale" | "keyDbLocale";
const UI_LOCALE_KEY = "keyUiLocale";
const DB_LOCALE_KEY = "keyDbLocale";
type D2UserGroupByKey = Record<Id, NamedRef[]>;
type D2ActionGroup = "add" | "delete";
