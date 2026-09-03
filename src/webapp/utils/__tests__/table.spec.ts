import { describe, it, expect } from "vitest";
import { filterAndSortItemWithUsers } from "../table";
import { Maybe } from "../../../types/utils";

type Item = { name: string; description: Maybe<string>; users: { id: string }[] };

const items: Item[] = [
    { name: "Administrators", description: "Full access to the system", users: [{ id: "user-1" }] },
    { name: "HIV Coordinators", description: "Manages the HIV program", users: [{ id: "user-2" }] },
    { name: "Data entry", description: undefined, users: [{ id: "user-3" }] },
];

describe("filterAndSortItemWithUsers", () => {
    it("searches only by name when no search fields are given", () => {
        const result = filterItems({ search: "program" });

        expect(result).toEqual([]);
    });

    it("searches by the given fields", () => {
        const result = filterItems({ search: "program", searchFields: ["name", "description"] });

        expect(names(result)).toEqual(["HIV Coordinators"]);
    });

    it("keeps matching by name when searching several fields", () => {
        const result = filterItems({ search: "administrators", searchFields: ["name", "description"] });

        expect(names(result)).toEqual(["Administrators"]);
    });

    it("ignores items whose searched field has no value", () => {
        const result = filterItems({ search: "manages", searchFields: ["name", "description"] });

        expect(names(result)).toEqual(["HIV Coordinators"]);
    });

    it("sorts by name regardless of the searched fields", () => {
        const result = filterItems({ search: "", sort: "desc", searchFields: ["name", "description"] });

        expect(names(result)).toEqual(["HIV Coordinators", "Data entry", "Administrators"]);
    });

    function filterItems(options: { search: string; sort?: "asc" | "desc"; searchFields?: Array<keyof Item> }): Item[] {
        return filterAndSortItemWithUsers({
            items: items,
            search: options.search,
            sort: options.sort ?? "asc",
            filterEmptyUsers: false,
            selectedUsersIds: undefined,
            searchFields: options.searchFields,
        });
    }
});

function names(items: Item[]): string[] {
    return items.map(item => item.name);
}
