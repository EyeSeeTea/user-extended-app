import { getFieldsAsString } from "@eyeseetea/d2-api/api/common";
import { savePrefetchFields } from "../UserD2ApiRepository";

describe("savePrefetchFields", () => {
    it("requests the $owner preset", () => {
        // Regression: /api/metadata defaults to mergeMode=REPLACE, so the server nulls every owned
        // property the payload omits. A whitelist drops what the app does not map, e.g. verifiedEmail.
        expect(savePrefetchFields.$owner).toEqual(true);
    });

    it("adds the properties that $owner does not return", () => {
        // The user schema marks these three as not owned.
        expect(Object.keys(savePrefetchFields)).toEqual(
            expect.arrayContaining(["access", "userGroups", "userCredentials"])
        );
    });

    it("expands the collections that $owner returns as ids", () => {
        // $owner owns these collections, but it returns them as [{ id }].
        const fields = getFieldsAsString(savePrefetchFields);

        expect(fields).toContain("organisationUnits[code,id,name,path]");
        expect(fields).toContain("userRoles[authorities,id,name]");
    });
});
