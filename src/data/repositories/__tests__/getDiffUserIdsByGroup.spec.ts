import { getDiffUserIdsByGroup } from "../../utils";
import { D2UserGroupByKey } from "../UserD2ApiRepository";

describe("getDiffUserIdsByGroup", () => {
    it("returns ids present in source and absent in reference (basic diff)", () => {
        const source: D2UserGroupByKey = {
            A: [
                { id: "1", name: "Alice" },
                { id: "2", name: "Bob" },
                { id: "3", name: "Cara" },
            ],
        };
        const reference: D2UserGroupByKey = {
            A: [
                { id: "2", name: "Bobby" },
                { id: "4", name: "Dora" },
            ],
        };

        const result = getDiffUserIdsByGroup(source, reference);
        expect(result).toEqual([{ id: "A", usersIds: ["1", "3"] }]);
    });

    it("includes groups only in source (all ids are returned)", () => {
        const source: D2UserGroupByKey = { B: [{ id: "5", name: "Eva" }] };
        const reference: D2UserGroupByKey = {};

        const result = getDiffUserIdsByGroup(source, reference);
        expect(result).toEqual([{ id: "B", usersIds: ["5"] }]);
    });

    it("returns empty array when source has no groups, even if reference does", () => {
        const source: D2UserGroupByKey = {};
        const reference: D2UserGroupByKey = { C: [{ id: "9", name: "Nina" }] };

        const result = getDiffUserIdsByGroup(source, reference);
        expect(result).toEqual([]);
    });

    it("handles empty inputs on both sides", () => {
        expect(getDiffUserIdsByGroup({}, {})).toEqual([]);
    });

    it("returns the group with empty usersIds when the group in source is empty", () => {
        const source: D2UserGroupByKey = { A: [] };
        const reference: D2UserGroupByKey = { A: [{ id: "1", name: "Alice" }] };

        const result = getDiffUserIdsByGroup(source, reference);
        expect(result).toEqual([{ id: "A", usersIds: [] }]);
    });

    it("returns userIds without duplicates", () => {
        const source: D2UserGroupByKey = {
            G: [
                { id: "a", name: "Alpha #1" },
                { id: "a", name: "Alpha #2" },
                { id: "b", name: "Beta" },
            ],
        };
        const reference: D2UserGroupByKey = {
            G: [
                { id: "b", name: "Beta (ref)" },
                { id: "b", name: "Beta dup (ref)" },
            ],
        };

        const result = getDiffUserIdsByGroup(source, reference);
        expect(result).toEqual([{ id: "G", usersIds: ["a"] }]);
    });
});
