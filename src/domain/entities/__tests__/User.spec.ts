import {
    User,
    defaultUser,
    isSuperAdmin,
    hasReplicateAuthority,
    allUsersHaveAllSpecifiedAccesses,
    userWithinOrgUnits,
    userInheritedOrgUnitIds,
    userOrgUnitIds,
    allUsersHaveEmail,
    allUsersBelongToAtLeastOneOrgUnit,
    allUsersAreDisabled,
    allUsersAreActive,
} from "../User";
import { OrgUnit } from "../OrgUnit";

// Test fixtures
const createUser = (overrides: Partial<User> = {}): User => ({
    ...defaultUser,
    ...overrides,
});

const rootOrgUnit: OrgUnit = {
    id: "root",
    name: "Root Organization",
    code: "ROOT",
    path: ["root"],
};

const childOrgUnit: OrgUnit = {
    id: "child1",
    name: "Child Organization 1",
    code: "CHILD1",
    path: ["root", "child1"],
};

const grandChildOrgUnit: OrgUnit = {
    id: "grandchild1",
    name: "Grandchild Organization 1",
    code: "GRANDCHILD1",
    path: ["root", "child1", "grandchild1"],
};

const anotherRootOrgUnit: OrgUnit = {
    id: "root2",
    name: "Another Root Organization",
    code: "ROOT2",
    path: ["root2"],
};

const superAdminUser = createUser({
    id: "super-admin",
    username: "superadmin",
    name: "Super Admin",
    authorities: ["ALL", "SOME_OTHER_AUTHORITY"],
    email: "admin@example.com",
    disabled: false,
    organisationUnits: [rootOrgUnit],
    access: {
        read: true,
        update: true,
        externalize: true,
        delete: true,
        write: true,
        manage: true,
    },
});

const replicateUser = createUser({
    id: "replicate-user",
    username: "replicateuser",
    name: "Replicate User",
    authorities: ["F_REPLICATE_USER", "SOME_OTHER_AUTHORITY"],
    email: "replicate@example.com",
    disabled: false,
    organisationUnits: [childOrgUnit],
    access: {
        read: true,
        update: true,
        externalize: false,
        delete: false,
        write: true,
        manage: false,
    },
});

const regularUser = createUser({
    id: "regular-user",
    username: "regularuser",
    name: "Regular User",
    authorities: ["BASIC_AUTHORITY"],
    email: "user@example.com",
    disabled: false,
    organisationUnits: [grandChildOrgUnit],
    access: {
        read: true,
        update: false,
        externalize: false,
        delete: false,
        write: false,
        manage: false,
    },
});

const userWithoutEmail = createUser({
    id: "no-email-user",
    username: "noemailuser",
    name: "No Email User",
    authorities: ["BASIC_AUTHORITY"],
    email: "",
    disabled: false,
    organisationUnits: [rootOrgUnit],
    access: {
        read: true,
        update: true,
        externalize: true,
        delete: true,
        write: true,
        manage: true,
    },
});

const disabledUser = createUser({
    id: "disabled-user",
    username: "disableduser",
    name: "Disabled User",
    authorities: ["BASIC_AUTHORITY"],
    email: "disabled@example.com",
    disabled: true,
    organisationUnits: [anotherRootOrgUnit],
    access: {
        read: true,
        update: false,
        externalize: false,
        delete: false,
        write: false,
        manage: false,
    },
});

const userWithMultipleOrgUnits = createUser({
    id: "multi-org-user",
    username: "multiorguser",
    name: "Multi Org User",
    authorities: ["BASIC_AUTHORITY"],
    email: "multi@example.com",
    disabled: false,
    organisationUnits: [rootOrgUnit, childOrgUnit],
    access: {
        read: true,
        update: true,
        externalize: false,
        delete: false,
        write: true,
        manage: false,
    },
});

describe("User entity functions", () => {
    describe("isSuperAdmin", () => {
        it("should return true for user with ALL authority", () => {
            expect(isSuperAdmin(superAdminUser)).toBe(true);
        });

        it("should return false for user without ALL authority", () => {
            expect(isSuperAdmin(replicateUser)).toBe(false);
            expect(isSuperAdmin(regularUser)).toBe(false);
        });

        it("should return false for user with empty authorities", () => {
            const userWithNoAuthorities = createUser({
                authorities: [],
            });
            expect(isSuperAdmin(userWithNoAuthorities)).toBe(false);
        });
    });

    describe("hasReplicateAuthority", () => {
        it("should return true for user with F_REPLICATE_USER authority", () => {
            expect(hasReplicateAuthority(replicateUser)).toBe(true);
        });

        it("should return false for user without F_REPLICATE_USER authority", () => {
            expect(hasReplicateAuthority(superAdminUser)).toBe(false);
            expect(hasReplicateAuthority(regularUser)).toBe(false);
        });

        it("should return false for user with empty authorities", () => {
            const userWithNoAuthorities = createUser({
                authorities: [],
            });
            expect(hasReplicateAuthority(userWithNoAuthorities)).toBe(false);
        });
    });

    describe("allUsersHaveAllSpecifiedAccesses", () => {
        it("should return true when all users have all specified accesses", () => {
            const users = [superAdminUser, userWithoutEmail];
            const accesses = ["read", "update", "write"];
            expect(allUsersHaveAllSpecifiedAccesses(users, accesses)).toBe(true);
        });

        it("should return false when some users lack specified accesses", () => {
            const users = [superAdminUser, regularUser];
            const accesses = ["read", "update", "delete"];
            expect(allUsersHaveAllSpecifiedAccesses(users, accesses)).toBe(false);
        });

        it("should return true when no accesses are specified", () => {
            const users = [regularUser, disabledUser];
            const accesses: string[] = [];
            expect(allUsersHaveAllSpecifiedAccesses(users, accesses)).toBe(true);
        });

        it("should return true when users array is empty", () => {
            const users: User[] = [];
            const accesses = ["read", "write"];
            expect(allUsersHaveAllSpecifiedAccesses(users, accesses)).toBe(true);
        });

        it("should only consider truthy access values", () => {
            const userWithMixedAccess = createUser({
                access: {
                    read: true,
                    update: false,
                    externalize: true,
                    delete: false,
                    write: false,
                    manage: false,
                },
            });
            const users = [userWithMixedAccess];
            const accesses = ["read", "externalize"];
            expect(allUsersHaveAllSpecifiedAccesses(users, accesses)).toBe(true);

            const accessesIncludingFalsy = ["read", "update"];
            expect(allUsersHaveAllSpecifiedAccesses(users, accessesIncludingFalsy)).toBe(false);
        });
    });

    describe("userOrgUnitIds", () => {
        it("should return array of org unit ids for user", () => {
            const orgUnitIds = userOrgUnitIds(userWithMultipleOrgUnits);
            expect(orgUnitIds).toEqual(["root", "child1"]);
        });

        it("should return single org unit id for user with one org unit", () => {
            const orgUnitIds = userOrgUnitIds(regularUser);
            expect(orgUnitIds).toEqual(["grandchild1"]);
        });

        it("should return empty array for user with no org units", () => {
            const userWithNoOrgUnits = createUser({
                organisationUnits: [],
            });
            const orgUnitIds = userOrgUnitIds(userWithNoOrgUnits);
            expect(orgUnitIds).toEqual([]);
        });
    });

    describe("userInheritedOrgUnitIds", () => {
        it("should return all org unit ids from paths for user with single org unit", () => {
            const inheritedIds = userInheritedOrgUnitIds(regularUser);
            // grandChildOrgUnit has path: ["root", "child1", "grandchild1"]
            expect(inheritedIds.sort()).toEqual(["root", "child1", "grandchild1"].sort());
        });

        it("should return unique org unit ids from multiple org units", () => {
            const inheritedIds = userInheritedOrgUnitIds(userWithMultipleOrgUnits);
            // rootOrgUnit has path: ["root"]
            // childOrgUnit has path: ["root", "child1"]
            // Should return unique values: ["root", "child1"]
            expect(inheritedIds.sort()).toEqual(["root", "child1"].sort());
        });

        it("should return empty array for user with no org units", () => {
            const userWithNoOrgUnits = createUser({
                organisationUnits: [],
            });
            const inheritedIds = userInheritedOrgUnitIds(userWithNoOrgUnits);
            expect(inheritedIds).toEqual([]);
        });

        it("should handle org units with empty paths", () => {
            const userWithEmptyPathOrgUnit = createUser({
                organisationUnits: [{ id: "test", name: "Test", code: "TEST", path: [] }],
            });
            const inheritedIds = userInheritedOrgUnitIds(userWithEmptyPathOrgUnit);
            expect(inheritedIds).toEqual([]);
        });

        it("should deduplicate org unit ids from overlapping paths", () => {
            const overlappingOrgUnits = [
                { id: "parent", name: "Parent", code: "PARENT", path: ["root", "parent"] },
                { id: "child", name: "Child", code: "CHILD", path: ["root", "parent", "child"] },
            ];
            const userWithOverlappingOrgUnits = createUser({
                organisationUnits: overlappingOrgUnits,
            });
            const inheritedIds = userInheritedOrgUnitIds(userWithOverlappingOrgUnits);
            expect(inheritedIds.sort()).toEqual(["root", "parent", "child"].sort());
        });
    });

    describe("userWithinOrgUnits", () => {
        it("should return true when user belongs to one of the specified org units", () => {
            const orgUnitIds = ["root"];
            expect(userWithinOrgUnits(superAdminUser, orgUnitIds)).toBe(true);
        });

        it("should return true when user inherits from specified org units through hierarchy", () => {
            // regularUser has grandchild1 with path ["root", "child1", "grandchild1"]
            const orgUnitIds = ["root"]; // Should match because root is in the path
            expect(userWithinOrgUnits(regularUser, orgUnitIds)).toBe(true);

            const childOrgUnitIds = ["child1"]; // Should also match
            expect(userWithinOrgUnits(regularUser, childOrgUnitIds)).toBe(true);
        });

        it("should return false when user doesn't belong to any specified org units", () => {
            // superAdminUser belongs to root
            const orgUnitIds = ["root2", "someother"];
            expect(userWithinOrgUnits(superAdminUser, orgUnitIds)).toBe(false);
        });

        it("should return false when org unit ids array is empty", () => {
            const orgUnitIds: string[] = [];
            expect(userWithinOrgUnits(superAdminUser, orgUnitIds)).toBe(false);
        });

        it("should return false when user has no org units", () => {
            const userWithNoOrgUnits = createUser({
                organisationUnits: [],
            });
            const orgUnitIds = ["root"];
            expect(userWithinOrgUnits(userWithNoOrgUnits, orgUnitIds)).toBe(false);
        });

        it("should handle multiple org units for user", () => {
            // userWithMultipleOrgUnits has root and child1
            const orgUnitIds = ["child1"];
            expect(userWithinOrgUnits(userWithMultipleOrgUnits, orgUnitIds)).toBe(true);

            const nonMatchingOrgUnitIds = ["root2", "someother"];
            expect(userWithinOrgUnits(userWithMultipleOrgUnits, nonMatchingOrgUnitIds)).toBe(false);
        });
    });

    describe("allUsersHaveEmail", () => {
        it("should return true when all users have email", () => {
            const users = [superAdminUser, replicateUser, regularUser];
            expect(allUsersHaveEmail(users)).toBe(true);
        });

        it("should return false when some users don't have email", () => {
            const users = [superAdminUser, userWithoutEmail];
            expect(allUsersHaveEmail(users)).toBe(false);
        });

        it("should return false when user has null or undefined email", () => {
            const userWithNullEmail = createUser({
                email: null as any,
            });
            const userWithUndefinedEmail = createUser({
                email: undefined as any,
            });
            const users = [userWithNullEmail, userWithUndefinedEmail];
            expect(allUsersHaveEmail(users)).toBe(false);
        });

        it("should return true for empty users array", () => {
            const users: User[] = [];
            expect(allUsersHaveEmail(users)).toBe(true);
        });

        it("should return true for whitespace-only email (current behavior)", () => {
            const userWithWhitespaceEmail = createUser({
                email: "   ",
            });
            const users = [userWithWhitespaceEmail];
            // Boolean("   ") returns true, so this is the current behavior
            expect(allUsersHaveEmail(users)).toBe(true);
        });
    });

    describe("allUsersBelongToAtLeastOneOrgUnit", () => {
        it("should return true when all users belong to at least one specified org unit", () => {
            const users = [superAdminUser, replicateUser]; // root and child1
            const orgUnitIds = ["root", "child1", "someother"];
            expect(allUsersBelongToAtLeastOneOrgUnit(users, orgUnitIds)).toBe(true);
        });

        it("should return false when some users don't belong to any specified org unit", () => {
            const users = [superAdminUser, disabledUser]; // root and root2
            const orgUnitIds = ["child1", "grandchild1"];
            expect(allUsersBelongToAtLeastOneOrgUnit(users, orgUnitIds)).toBe(false);
        });

        it("should handle inherited org units through path", () => {
            const users = [regularUser]; // grandchild1 with path ["root", "child1", "grandchild1"]
            const orgUnitIds = ["root"]; // Should match because root is in the path
            expect(allUsersBelongToAtLeastOneOrgUnit(users, orgUnitIds)).toBe(true);
        });

        it("should return true for empty users array", () => {
            const users: User[] = [];
            const orgUnitIds = ["root"];
            expect(allUsersBelongToAtLeastOneOrgUnit(users, orgUnitIds)).toBe(true);
        });

        it("should return false when org unit ids array is empty", () => {
            const users = [superAdminUser];
            const orgUnitIds: string[] = [];
            expect(allUsersBelongToAtLeastOneOrgUnit(users, orgUnitIds)).toBe(false);
        });

        it("should handle users with multiple org units", () => {
            const users = [userWithMultipleOrgUnits]; // root and child1
            const orgUnitIds = ["child1"];
            expect(allUsersBelongToAtLeastOneOrgUnit(users, orgUnitIds)).toBe(true);
        });
    });

    describe("allUsersAreDisabled", () => {
        it("should return true when all users are disabled", () => {
            const allDisabledUsers = [disabledUser, createUser({ disabled: true })];
            expect(allUsersAreDisabled(allDisabledUsers)).toBe(true);
        });

        it("should return false when some users are active", () => {
            const mixedUsers = [disabledUser, superAdminUser];
            expect(allUsersAreDisabled(mixedUsers)).toBe(false);
        });

        it("should return false when all users are active", () => {
            const allActiveUsers = [superAdminUser, replicateUser, regularUser];
            expect(allUsersAreDisabled(allActiveUsers)).toBe(false);
        });

        it("should return true for empty users array", () => {
            const users: User[] = [];
            expect(allUsersAreDisabled(users)).toBe(true);
        });
    });

    describe("allUsersAreActive", () => {
        it("should return true when all users are active", () => {
            const allActiveUsers = [superAdminUser, replicateUser, regularUser];
            expect(allUsersAreActive(allActiveUsers)).toBe(true);
        });

        it("should return false when some users are disabled", () => {
            const mixedUsers = [superAdminUser, disabledUser];
            expect(allUsersAreActive(mixedUsers)).toBe(false);
        });

        it("should return false when all users are disabled", () => {
            const allDisabledUsers = [disabledUser, createUser({ disabled: true })];
            expect(allUsersAreActive(allDisabledUsers)).toBe(false);
        });

        it("should return true for empty users array", () => {
            const users: User[] = [];
            expect(allUsersAreActive(users)).toBe(true);
        });
    });
});
