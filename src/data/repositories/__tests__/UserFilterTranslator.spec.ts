import { describe, it, expect } from "vitest";
import { translateUserFilters } from "../UserFilterTranslator";
import { UserListFilters } from "../../../domain/repositories/UserRepository";

describe("onlyActiveUsers override", () => {
    it("forces disabled=false on 2.41 (userCredentials prefix)", () => {
        const result = translateUserFilters(undefined, true, false);

        expect(result).toEqual({ "userCredentials.disabled": { eq: "false" } });
    });

    it("forces disabled=false on 2.42 (root key)", () => {
        const result = translateUserFilters(undefined, true, true);

        expect(result).toEqual({ disabled: { eq: "false" } });
    });

    it("onlyActiveUsers takes precedence over filters.disabled=true on 2.41", () => {
        const result = translateUserFilters({ disabled: true }, true, false);

        expect(result["userCredentials.disabled"]).toEqual({ eq: "false" });
    });

    it("onlyActiveUsers takes precedence over filters.disabled=true on 2.42", () => {
        const result = translateUserFilters({ disabled: true }, true, true);

        expect(result["disabled"]).toEqual({ eq: "false" });
    });
});

describe("disabled filter (no onlyActiveUsers)", () => {
    it("emits userCredentials.disabled on 2.41 when disabled=false", () => {
        const result = translateUserFilters({ disabled: false }, false, false);

        expect(result["userCredentials.disabled"]).toEqual({ eq: "false" });
    });

    it("emits root disabled on 2.42 when disabled=false", () => {
        const result = translateUserFilters({ disabled: false }, false, true);

        expect(result["disabled"]).toEqual({ eq: "false" });
    });

    it("emits disabled=true on 2.41", () => {
        const result = translateUserFilters({ disabled: true }, false, false);

        expect(result["userCredentials.disabled"]).toEqual({ eq: "true" });
    });

    it("omits disabled key when disabled is null", () => {
        const result = translateUserFilters({ disabled: null }, false, false);

        expect(result["userCredentials.disabled"]).toBeUndefined();
        expect(result["disabled"]).toBeUndefined();
    });

    it("omits disabled key when disabled is undefined", () => {
        const result = translateUserFilters({ disabled: undefined }, false, false);

        expect(result["userCredentials.disabled"]).toBeUndefined();
    });
});

describe("twoFA filter", () => {
    it("emits userCredentials.twoFA on 2.41", () => {
        const result = translateUserFilters({ twoFA: true }, false, false);

        expect(result["userCredentials.twoFA"]).toEqual({ eq: "true" });
    });

    it("drops twoFA silently on 2.42", () => {
        const result = translateUserFilters({ twoFA: true }, false, true);

        expect(result["userCredentials.twoFA"]).toBeUndefined();
    });

    it("omits twoFA on 2.41 when null", () => {
        const result = translateUserFilters({ twoFA: null }, false, false);

        expect(result["userCredentials.twoFA"]).toBeUndefined();
    });
});

describe("externalAuth filter", () => {
    it("emits userCredentials.externalAuth on 2.41", () => {
        const result = translateUserFilters({ externalAuth: true }, false, false);

        expect(result["userCredentials.externalAuth"]).toEqual({ eq: "true" });
    });

    it("emits root externalAuth on 2.42", () => {
        const result = translateUserFilters({ externalAuth: true }, false, true);

        expect(result["externalAuth"]).toEqual({ eq: "true" });
    });

    it("omits externalAuth when null", () => {
        const result = translateUserFilters({ externalAuth: null }, false, false);

        expect(result["userCredentials.externalAuth"]).toBeUndefined();
    });
});

describe("userRoles filter", () => {
    it("emits userCredentials.userRoles.id on 2.41", () => {
        const result = translateUserFilters({ userRoles: ["r1", "r2"] }, false, false);

        expect(result["userCredentials.userRoles.id"]).toEqual({ in: ["r1", "r2"] });
    });

    it("emits root userRoles.id on 2.42", () => {
        const result = translateUserFilters({ userRoles: ["r1", "r2"] }, false, true);

        expect(result["userRoles.id"]).toEqual({ in: ["r1", "r2"] });
    });

    it("omits userRoles when empty array", () => {
        const result = translateUserFilters({ userRoles: [] }, false, false);

        expect(result["userCredentials.userRoles.id"]).toBeUndefined();
    });
});

describe("org unit filters (same key on all versions)", () => {
    it("emits organisationUnits.id", () => {
        const result = translateUserFilters({ organisationUnits: ["ou1"] }, false, false);

        expect(result["organisationUnits.id"]).toEqual({ in: ["ou1"] });
    });

    it("emits organisationUnits.id on 2.42", () => {
        const result = translateUserFilters({ organisationUnits: ["ou1"] }, false, true);

        expect(result["organisationUnits.id"]).toEqual({ in: ["ou1"] });
    });

    it("emits dataViewOrganisationUnits.id", () => {
        const result = translateUserFilters({ dataViewOrganisationUnits: ["dv1"] }, false, false);

        expect(result["dataViewOrganisationUnits.id"]).toEqual({ in: ["dv1"] });
    });

    it("emits teiSearchOrganisationUnits.id", () => {
        const result = translateUserFilters({ teiSearchOrganisationUnits: ["s1"] }, false, false);

        expect(result["teiSearchOrganisationUnits.id"]).toEqual({ in: ["s1"] });
    });

    it("omits org units when empty", () => {
        const result = translateUserFilters({ organisationUnits: [] }, false, false);

        expect(result["organisationUnits.id"]).toBeUndefined();
    });
});

describe("username filter", () => {
    it("emits userCredentials.username on 2.41", () => {
        const result = translateUserFilters({ username: ["admin", "bob"] }, false, false);

        expect(result["userCredentials.username"]).toEqual({ in: ["admin", "bob"] });
    });

    it("emits root username on 2.42", () => {
        const result = translateUserFilters({ username: ["admin", "bob"] }, false, true);

        expect(result["username"]).toEqual({ in: ["admin", "bob"] });
    });
});

describe("id filter", () => {
    it("emits id on any version", () => {
        const ids = ["abc123", "def456"];

        expect(translateUserFilters({ id: ids }, false, false)["id"]).toEqual({ in: ids });
        expect(translateUserFilters({ id: ids }, false, true)["id"]).toEqual({ in: ids });
    });

    it("omits id when empty", () => {
        const result = translateUserFilters({ id: [] }, false, false);

        expect(result["id"]).toBeUndefined();
    });
});

describe("undefined filters", () => {
    it("returns empty object when filters undefined and onlyActiveUsers false", () => {
        expect(translateUserFilters(undefined, false, false)).toEqual({});
        expect(translateUserFilters(undefined, false, true)).toEqual({});
    });
});

describe("combined scenario (2.41, onlyActive + roles + groups)", () => {
    it("produces correct combined filter", () => {
        const filters: UserListFilters = {
            userRoles: ["r1"],
            userGroups: ["g1"],
        };
        const result = translateUserFilters(filters, true, false);

        expect(result["userCredentials.disabled"]).toEqual({ eq: "false" });
        expect(result["userCredentials.userRoles.id"]).toEqual({ in: ["r1"] });
        expect(result["userGroups.id"]).toEqual({ in: ["g1"] });
    });
});

describe("combined scenario (2.42, disabled filter + externalAuth)", () => {
    it("produces correct root-level keys", () => {
        const filters: UserListFilters = {
            disabled: true,
            externalAuth: false,
        };
        const result = translateUserFilters(filters, false, true);

        expect(result["disabled"]).toEqual({ eq: "true" });
        expect(result["externalAuth"]).toEqual({ eq: "false" });
        expect(result["userCredentials.disabled"]).toBeUndefined();
        expect(result["userCredentials.externalAuth"]).toBeUndefined();
    });
});
