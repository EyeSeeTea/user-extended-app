import _ from "lodash";
import { UseCase } from "../../CompositionRoot";
import { AppSettings } from "../entities/AppSettings";
import { Future, FutureData } from "../entities/Future";
import { Pager } from "../entities/PaginatedResponse";
import { User } from "../entities/User";
import { isSuperAdmin } from "../entities/UserProps";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository, ListOptions, UserListFilters } from "../repositories/UserRepository";
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
        // Separate the disabled filter from the rest so we can combine each
        // non-disabled filter with disabled in individual OR-junction requests.
        const { disabled, ...restFilters } = options.filters ?? {};

        const activeFilterEntries = Object.entries(restFilters).filter(([_, value]) => {
            if (value === undefined || value === null) return false;
            if (Array.isArray(value)) return value.length > 0;
            return true;
        });

        if (activeFilterEntries.length === 0) {
            return this.userRepository.list({
                ...options,
                onlyActiveUsers: false,
                hideUsers: appSettings.hide.users,
            });
        }

        const baseFilters: UserListFilters = {
            ...(disabled !== null && disabled !== undefined ? { disabled } : {}),
        };

        const $requests = activeFilterEntries.map(([fieldName, fieldValue]) => {
            return this.userRepository.listAll({
                filters: { ...baseFilters, [fieldName]: fieldValue },
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
            const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

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

const DEFAULT_PAGE_SIZE = 25;
