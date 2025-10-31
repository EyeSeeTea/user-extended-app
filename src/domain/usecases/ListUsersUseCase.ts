import _ from "lodash";
import { UseCase } from "../../CompositionRoot";
import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
import { Pager } from "../entities/PaginatedResponse";
import { User } from "../entities/User";
import { isSuperAdmin } from "../entities/UserProps";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository, ListOptions, ListFilterType } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";

export class ListUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    public execute(options: ListOptions): FutureData<{ pager: Pager; objects: User[] }> {
        return this.userRepository.getCurrent().flatMap(currentUser => {
            return getAppSettings(this.appSettingsRepository, currentUser).flatMap(appSettings => {
                if (appSettings.isActive && appSettings.showOnlyActiveUsers && options.rootJunction === "OR") {
                    return this.getActiveUsers(options, appSettings);
                } else {
                    return this.userRepository.list({
                        ...options,
                        onlyActiveUsers: isSuperAdmin(currentUser) ? false : appSettings.showOnlyActiveUsers,
                        hideUsers: appSettings.hide.users,
                    });
                }
            });
        });
    }

    private getActiveUsers(
        options: ListOptions,
        appSettings: AppSettings
    ): FutureData<{ pager: Pager; objects: User[] }> {
        const disabledKey = "userCredentials.disabled";

        const otherFilters = _(options.filters)
            .map((items, key) => {
                if (key === disabledKey) return undefined;
                if (!items) return undefined;
                return { fieldName: key, values: items };
            })
            .compact()
            .value();

        if (otherFilters.length === 0) {
            return this.userRepository.list({
                ...options,
                onlyActiveUsers: false,
                hideUsers: appSettings.hide.users,
            });
        }

        const disabledFilter = options.filters ? options.filters["userCredentials.disabled"] : undefined;

        const baseFilters: Record<string, [ListFilterType, string[]]> = {
            ...(disabledFilter ? { "userCredentials.disabled": disabledFilter } : {}),
        };

        const $requests = otherFilters.map(filter => {
            return this.userRepository.listAll({
                filters: {
                    ...baseFilters,
                    [filter.fieldName]: filter.values,
                },
                hideUsers: appSettings.hide.users,
                onlyActiveUsers: options.onlyActiveUsers,
                onlyUsersOrgUnits: options.onlyUsersOrgUnits,
                search: options.search,
                canManage: options.canManage,
            });
        });

        return Future.parallel($requests).map(responses => {
            const objects = _(responses)
                .flatMap()
                .uniqBy(user => user.id)
                .value();

            const currentPage = options.page ?? 1;
            const pageSize = options.pageSize ?? 25;

            const start = (currentPage - 1) * pageSize;
            const end = start + pageSize;
            const currentUsers = objects.slice(start, end);

            return {
                pager: {
                    page: currentPage,
                    pageSize: pageSize,
                    total: objects.length,
                    pageCount: Math.ceil(objects.length / pageSize),
                },
                objects: currentUsers,
            };
        });
    }
}
