import { OrgUnit } from "../OrgUnit";
import { canRunPasswordActionOnUsers, isPasswordAction } from "../PasswordActionAccess";
import { User } from "../User";
import { UserAction } from "../UserAction";
import { defaultUserProps, UserProps } from "../UserProps";

/* OU-Parent
 *   └── OU-MyUnit          <- current user's data capture org unit
 *         └── OU-Child
 *               └── OU-Grandchild
 * OU-Other                 <- sibling branch
 */
const parentOrgUnit = givenOrgUnit("parent", ["parent"]);
const myOrgUnit = givenOrgUnit("mine", ["parent", "mine"]);
const childOrgUnit = givenOrgUnit("child", ["parent", "mine", "child"]);
const grandchildOrgUnit = givenOrgUnit("grandchild", ["parent", "mine", "child", "grandchild"]);
const otherOrgUnit = givenOrgUnit("other", ["other"]);

describe("isPasswordAction", () => {
    it("should be true for set and reset password actions", () => {
        expect(isPasswordAction(UserAction.SET_PASSWORD)).toBe(true);
        expect(isPasswordAction(UserAction.RESET_PASSWORD)).toBe(true);
    });

    it("should be false for any other action", () => {
        expect(isPasswordAction(UserAction.EDIT)).toBe(false);
        expect(isPasswordAction(UserAction.REMOVE)).toBe(false);
    });
});

describe("canRunPasswordActionOnUsers", () => {
    it("should allow users outside the org units when the setting is disabled", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([myOrgUnit]),
            users: [givenUser("out", [otherOrgUnit])],
            isLimitedToOrgUnits: false,
        });

        expect(result).toBe(true);
    });

    it("should allow super admins even for users outside the org units", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenSuperAdmin([myOrgUnit]),
            users: [givenUser("out", [otherOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(true);
    });

    it("should allow users in the same org unit", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([myOrgUnit]),
            users: [givenUser("mine", [myOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(true);
    });

    it("should allow users in org units below, at any depth", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([myOrgUnit]),
            users: [givenUser("child", [childOrgUnit]), givenUser("grandchild", [grandchildOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(true);
    });

    it("should deny users in an org unit above", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([myOrgUnit]),
            users: [givenUser("parent", [parentOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(false);
    });

    it("should deny users in a sibling org unit", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([myOrgUnit]),
            users: [givenUser("other", [otherOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(false);
    });

    it("should deny the whole selection when a single user is outside the org units", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([myOrgUnit]),
            users: [givenUser("child", [childOrgUnit]), givenUser("other", [otherOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(false);
    });

    it("should deny everything when the current user has no data capture org units", () => {
        const result = canRunPasswordActionOnUsers({
            currentUser: givenCurrentUser([]),
            users: [givenUser("mine", [myOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(false);
    });

    it("should only take data capture org units of the current user into account", () => {
        const currentUser: UserProps = {
            ...givenCurrentUser([myOrgUnit]),
            dataViewOrganisationUnits: [parentOrgUnit],
            searchOrganisationsUnits: [parentOrgUnit],
        };

        const result = canRunPasswordActionOnUsers({
            currentUser,
            users: [givenUser("parent", [parentOrgUnit])],
            isLimitedToOrgUnits: true,
        });

        expect(result).toBe(false);
    });
});

function givenOrgUnit(id: string, path: string[]): OrgUnit {
    return { id, name: id, code: id, path };
}

function givenCurrentUser(organisationUnits: OrgUnit[]): UserProps {
    return { ...defaultUserProps, id: "current", username: "current", authorities: [], organisationUnits };
}

function givenSuperAdmin(organisationUnits: OrgUnit[]): UserProps {
    return { ...givenCurrentUser(organisationUnits), authorities: ["ALL"] };
}

function givenUser(id: string, organisationUnits: OrgUnit[]): User {
    return new User({ ...defaultUserProps, id, username: id, organisationUnits });
}
