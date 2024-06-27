import { defaultUser, hasReplicateAuthority, isSuperAdmin } from "../User";

describe("User", () => {
    describe("isSuperAdmin", () => {
        it('should return true when the user has "ALL" authority', () => {
            const adminUser = { ...defaultUser, authorities: ["ALL"] };

            expect(isSuperAdmin(adminUser)).toBe(true);
        });

        it('should return false when the user does not have "ALL" authority', () => {
            const nonAdminUser = { ...defaultUser, authorities: [] };

            expect(isSuperAdmin(nonAdminUser)).toBe(false);
        });
    });

    describe("hasReplicateAuthority", () => {
        it('should return true when the user has "F_REPLICATE_USER" authority', () => {
            const userWithReplicate = { ...defaultUser, authorities: ["F_REPLICATE_USER"] };

            expect(hasReplicateAuthority(userWithReplicate)).toBe(true);
        });

        it('should return false when the user does not have "F_REPLICATE_USER" authority', () => {
            const userWithoutReplicate = { ...defaultUser, authorities: ["F_USER_ADD"] };

            expect(hasReplicateAuthority(userWithoutReplicate)).toBe(false);
        });
    });
});
