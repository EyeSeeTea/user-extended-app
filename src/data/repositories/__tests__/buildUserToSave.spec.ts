import { buildUserToSave, buildUserWithoutPassword, ExistingApiUser } from "../../utils";
import { ApiUser } from "../UserD2ApiRepository";

describe("buildUserToSave", () => {
    it("keeps owned properties that the app does not map (verifiedEmail)", () => {
        // Regression: /api/metadata uses mergeMode=REPLACE, so an owned property missing from the
        // payload becomes null. Losing verifiedEmail locks out users with e-mail 2FA.
        const existingUser = givenUser({ verifiedEmail: "verified@example.com", emailVerificationToken: "token-abc" });

        const payload = buildUserToSave(existingUser, givenUser({ firstName: "Edited" }));

        expect(payload.verifiedEmail).toEqual("verified@example.com");
        expect(payload.emailVerificationToken).toEqual("token-abc");
        expect(payload.firstName).toEqual("Edited");
    });

    it("keeps every other owned property of the prefetched user", () => {
        const existingUser = { ...givenUser(), jobTitle: "Nurse", birthday: "1990-01-01" };

        const payload = buildUserToSave(existingUser, givenUser({ surname: "Edited" }));

        expect(payload).toMatchObject({ jobTitle: "Nurse", birthday: "1990-01-01", surname: "Edited" });
    });

    it("clears a property that the edited user empties", () => {
        const existingUser = givenUser({ phoneNumber: "123456" });

        const payload = buildUserToSave(existingUser, givenUser({ phoneNumber: "" }));

        expect(payload.phoneNumber).toEqual("");
    });

    it("builds a payload for a new user with no prefetched copy", () => {
        const payload = buildUserToSave(undefined, givenUser({ id: "newUserId00" }));

        expect(payload.id).toEqual("newUserId00");
        expect(payload.userCredentials.id).toEqual("newUserId00");
    });

    it("keeps 2FA enabled when the server has it on and the edited user does not carry it", () => {
        const existingUser = givenUser({ userCredentials: { twoFA: true } });

        const payload = buildUserToSave(existingUser, givenUser());

        expect(payload.userCredentials.twoFA).toEqual(true);
    });

    it("sends twoFA when the edited user enables it", () => {
        const editedUser = givenUser({ userCredentials: { twoFA: true } });

        const payload = buildUserToSave(givenUser(), editedUser);

        expect(payload.userCredentials.twoFA).toEqual(true);
    });

    it("drops the verified address when the edit changes the e-mail", () => {
        // DHIS2 keeps verifiedEmail unique: a stale value stops a different user from verifying
        // that address.
        const existingUser = givenUser({
            email: "old@example.com",
            verifiedEmail: "old@example.com",
            emailVerificationToken: "token-abc",
        });

        const payload = buildUserToSave(existingUser, givenUser({ email: "new@example.com" }));

        expect(payload.email).toEqual("new@example.com");
        expect(payload.verifiedEmail).toBeUndefined();
        expect(payload.emailVerificationToken).toBeUndefined();
    });
});

describe("buildUserWithoutPassword", () => {
    it("masks the password and the e-mail verification token before logging", () => {
        const user = givenUser({ emailVerificationToken: "token-abc" });

        const [logged] = buildUserWithoutPassword([user]);

        expect(logged?.password).toEqual("****");
        expect(logged?.userCredentials.password).toEqual("****");
        expect(logged).toMatchObject({ emailVerificationToken: "****" });
    });

    it("masks an owned property that the app does not declare but that holds a secret", () => {
        const user = { ...givenUser(), twoFactorSecret: "totp-seed", restoreToken: "restore-abc" };

        const [logged] = buildUserWithoutPassword([user]);

        expect(logged).toMatchObject({ twoFactorSecret: "****", restoreToken: "****" });
    });

    it("keeps a property whose name matches a secret but that holds no secret", () => {
        const user = givenUser();
        const userWithAudit = {
            ...user,
            userCredentials: { ...user.userCredentials, passwordLastUpdated: "2026-01-01" },
        };

        const [logged] = buildUserWithoutPassword([userWithAudit]);

        expect(logged?.userCredentials).toMatchObject({ passwordLastUpdated: "2026-01-01" });
    });
});

type UserOverrides = Partial<Omit<ExistingApiUser, "userCredentials">> & {
    userCredentials?: Partial<ApiUser["userCredentials"]>;
};

const defaultUser: ExistingApiUser = {
    id: "userId00001",
    name: "Ada Lovelace",
    username: "ada",
    firstName: "Ada",
    surname: "Lovelace",
    email: "ada@example.com",
    phoneNumber: "",
    whatsApp: "",
    facebookMessenger: "",
    skype: "",
    telegram: "",
    twitter: "",
    lastUpdated: "2026-01-01T00:00:00.000",
    created: "2020-01-01T00:00:00.000",
    lastLogin: "",
    disabled: false,
    externalAuth: false,
    ldapId: "",
    openId: "",
    userGroups: [],
    organisationUnits: [],
    dataViewOrganisationUnits: [],
    teiSearchOrganisationUnits: [],
    userRoles: [],
    access: { manage: true, externalize: true, write: true, read: true, update: true, delete: true },
    userCredentials: {
        id: "userId00001",
        username: "ada",
        userRoles: [],
        lastLogin: "",
        disabled: false,
        twoFA: false,
        openId: "",
        ldapId: "",
        externalAuth: false,
        password: "",
        accountExpiry: "",
    },
};

function givenUser(overrides: UserOverrides = {}): ExistingApiUser {
    return {
        ...defaultUser,
        ...overrides,
        userCredentials: { ...defaultUser.userCredentials, ...overrides.userCredentials },
    };
}
