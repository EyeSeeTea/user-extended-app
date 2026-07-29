import { getFieldsAsString } from "@eyeseetea/d2-api/api/common";
import { savePrefetchFields } from "../UserD2ApiRepository";

describe("savePrefetchFields", () => {
    it("requests the $owner preset", () => {
        // Regression: /api/metadata defaults to mergeMode=REPLACE, so the server nulls every owned
        // property the payload omits. A whitelist drops what the app does not map, e.g. verifiedEmail.
        expect(savePrefetchFields.$owner).toEqual(true);
    });

    it("requests the properties that $owner does not return", () => {
        expect(Object.keys(savePrefetchFields)).toEqual(
            expect.arrayContaining(["access", "userGroups", "userCredentials", "organisationUnits", "userRoles"])
        );
    });

    it("asks for org units with the shape the payload needs", () => {
        expect(getFieldsAsString(savePrefetchFields)).toContain("organisationUnits[code,id,name,path]");
    });
});
