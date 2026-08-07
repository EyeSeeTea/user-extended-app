import { Maybe } from "../../types/utils";
import { Id } from "../../domain/entities/Ref";
import _ from "lodash";
import { Pager } from "../../domain/entities/PaginatedResponse";

export function filterAndSortItemWithUsers<T extends { name: string; users: { id: string }[] }>(options: {
    items: T[];
    search: string;
    sort: "asc" | "desc";
    filterEmptyUsers: boolean;
    selectedUsersIds: Maybe<Id[]>;
    /* Text fields the search applies to. Defaults to the name only. */
    searchFields?: Array<keyof T>;
}): T[] {
    const { items, search, sort = "asc", filterEmptyUsers, selectedUsersIds } = options;
    const searchFields = options.searchFields ?? (["name"] as Array<keyof T>);
    const filtered = _(items)
        .filter(item => {
            const { users } = item;

            const matchesSearch = search
                ? searchFields.some(field => {
                      const value = item[field];
                      return typeof value === "string" && value.toLowerCase().includes(search.toLowerCase());
                  })
                : true;

            const matchesUsers =
                selectedUsersIds && selectedUsersIds.length > 0
                    ? users.some(user => selectedUsersIds.includes(user.id))
                    : true;

            return matchesSearch && matchesUsers;
        })
        .filter(item => {
            if (!filterEmptyUsers) return true;
            return item.users.length > 0;
        })
        .orderBy(item => item.name, sort)
        .value();

    return filtered;
}

export function createPagination<T>(records: T[], page: number, pageSize: number): { objects: T[]; pager: Pager } {
    const pager: Pager = {
        page: page,
        pageCount: Math.ceil(records.length / pageSize),
        total: records.length,
        pageSize: pageSize,
    };

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedRecords = records.slice(startIndex, endIndex);
    return { objects: pagedRecords, pager };
}
