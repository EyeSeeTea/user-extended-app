import { User } from "../User";
import { UserProps } from "../UserProps";

describe("User Entity", () => {
    const validUserProps: UserProps = {
        id: "user123",
        name: "John Doe",
        username: "johndoe",
        firstName: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        phoneNumber: "+1234567890",
        whatsApp: "",
        facebookMessenger: "",
        skype: "",
        telegram: "",
        twitter: "",
        lastUpdated: new Date(),
        created: new Date(),
        apiUrl: "https://api.example.com",
        userRoles: [{ id: "role1", name: "Admin" }],
        userGroups: [{ id: "group1", name: "Administrators" }],
        organisationUnits: [{ id: "org1", name: "Main Org", code: "MAIN", path: ["org1"] }],
        dataViewOrganisationUnits: [{ id: "org1", name: "Main Org", code: "MAIN", path: ["org1"] }],
        searchOrganisationsUnits: [{ id: "org1", name: "Main Org", code: "MAIN", path: ["org1"] }],
        lastLogin: new Date(),
        status: "active",
        disabled: false,
        access: { read: true, update: true, externalize: true, delete: true, write: true, manage: true },
        openId: null,
        ldapId: null,
        externalAuth: false,
        twoFactorEnabled: false,
        password: "ValidPassword123!",
        accountExpiry: null,
        authorities: ["F_USER_VIEW"],
        createdBy: { id: "creator1", username: "creator" },
        lastModifiedBy: { id: "modifier1", username: "modifier" },
        uiLocale: "en",
        dbLocale: "en",
    };

    describe("createNewUser factory method", () => {
        describe("successful creation", () => {
            it("should create a new user with valid properties", () => {
                const user = User.createNewUser(validUserProps);

                expect(user).toBeInstanceOf(User);
                expect(user.username).toBe("johndoe");
                expect(user.firstName).toBe("John");
                expect(user.surname).toBe("Doe");
                expect(user.email).toBe("john.doe@example.com");
            });

            it("should create a new user for existing user (password optional)", () => {
                const propsWithoutPassword = { ...validUserProps, password: "" };
                const user = User.createNewUser(propsWithoutPassword, true);

                expect(user).toBeInstanceOf(User);
                expect(user.username).toBe("johndoe");
            });

            it("should allow valid username with separators", () => {
                const propsWithValidUsername = { ...validUserProps, username: "john.doe_test@domain-name" };

                const user = User.createNewUser(propsWithValidUsername);

                expect(user).toBeInstanceOf(User);
                expect(user.username).toBe("john.doe_test@domain-name");
            });

            it("should allow empty email", () => {
                const propsWithEmptyEmail = { ...validUserProps, email: "" };

                const user = User.createNewUser(propsWithEmptyEmail);

                expect(user).toBeInstanceOf(User);
                expect(user.email).toBe("");
            });
        });

        describe("username validation", () => {
            it("should throw error when username is missing", () => {
                const propsWithoutUsername = { ...validUserProps, username: "" };

                expect(() => User.createNewUser(propsWithoutUsername)).toThrow(/username/i);
            });

            it("should throw error when username starts with separator", () => {
                const propsWithInvalidUsername = { ...validUserProps, username: ".johndoe" };

                expect(() => User.createNewUser(propsWithInvalidUsername)).toThrow(/separator/i);
            });

            it("should throw error when username ends with separator", () => {
                const propsWithInvalidUsername = { ...validUserProps, username: "johndoe." };

                expect(() => User.createNewUser(propsWithInvalidUsername)).toThrow(/separator/i);
            });

            it("should throw error when username has consecutive separators", () => {
                const propsWithInvalidUsername = { ...validUserProps, username: "john..doe" };

                expect(() => User.createNewUser(propsWithInvalidUsername)).toThrow(/separators/i);
            });

            it("should throw error when username is too short", () => {
                const propsWithShortUsername = { ...validUserProps, username: "a" };

                expect(() => User.createNewUser(propsWithShortUsername)).toThrow(/2 characters/i);
            });

            it("should throw error when username is too long", () => {
                const propsWithLongUsername = { ...validUserProps, username: "a".repeat(256) };

                expect(() => User.createNewUser(propsWithLongUsername)).toThrow(/255 characters/i);
            });

            it("should throw error when username contains invalid characters", () => {
                const propsWithInvalidUsername = { ...validUserProps, username: "john#doe" };

                expect(() => User.createNewUser(propsWithInvalidUsername)).toThrow(/separators/i);
            });
        });

        describe("password validation", () => {
            it("should throw error when password is missing for new user", () => {
                const propsWithoutPassword = { ...validUserProps, password: "" };

                expect(() => User.createNewUser(propsWithoutPassword, false)).toThrow(/password/i);
            });

            it("should throw error when password is too short", () => {
                const propsWithShortPassword = { ...validUserProps, password: "Short1!" };

                expect(() => User.createNewUser(propsWithShortPassword, false)).toThrow(/8 characters/i);
            });

            it("should throw error when password is too long", () => {
                const propsWithLongPassword = { ...validUserProps, password: "a".repeat(256) };

                expect(() => User.createNewUser(propsWithLongPassword, false)).toThrow(/255 characters/i);
            });

            it("should throw error when password lacks lowercase letter", () => {
                const propsWithInvalidPassword = { ...validUserProps, password: "PASSWORD123!" };

                expect(() => User.createNewUser(propsWithInvalidPassword, false)).toThrow(/lowercase/i);
            });

            it("should throw error when password lacks uppercase letter", () => {
                const propsWithInvalidPassword = { ...validUserProps, password: "password123!" };

                expect(() => User.createNewUser(propsWithInvalidPassword, false)).toThrow(/uppercase/i);
            });

            it("should throw error when password lacks number", () => {
                const propsWithInvalidPassword = { ...validUserProps, password: "Password!" };

                expect(() => User.createNewUser(propsWithInvalidPassword, false)).toThrow(/number/i);
            });

            it("should throw error when password lacks special character", () => {
                const propsWithInvalidPassword = { ...validUserProps, password: "Password123" };

                expect(() => User.createNewUser(propsWithInvalidPassword, false)).toThrow(/special character/i);
            });
        });

        describe("required fields validation", () => {
            it("should throw error when firstName is missing", () => {
                const propsWithoutFirstName = { ...validUserProps, firstName: "" };

                expect(() => User.createNewUser(propsWithoutFirstName)).toThrow(/firstName is required/i);
            });

            it("should throw error when surname is missing", () => {
                const propsWithoutSurname = { ...validUserProps, surname: "" };

                expect(() => User.createNewUser(propsWithoutSurname)).toThrow(/surname is required/i);
            });
        });

        describe("email validation", () => {
            it("should throw error when email is invalid", () => {
                const propsWithInvalidEmail = { ...validUserProps, email: "invalid-email" };

                expect(() => User.createNewUser(propsWithInvalidEmail)).toThrow(/valid email/i);
            });
        });

        describe("organizational fields validation", () => {
            it("should throw error when organisationUnits is empty", () => {
                const propsWithoutOrgUnits = { ...validUserProps, organisationUnits: [] };

                expect(() => User.createNewUser(propsWithoutOrgUnits)).toThrow(/organisationUnits/i);
            });

            it("should throw error when userRoles is empty", () => {
                const propsWithoutRoles = { ...validUserProps, userRoles: [] };

                expect(() => User.createNewUser(propsWithoutRoles)).toThrow(/userRoles/i);
            });

            it("should throw error when userGroups is empty", () => {
                const propsWithoutGroups = { ...validUserProps, userGroups: [] };

                expect(() => User.createNewUser(propsWithoutGroups)).toThrow(/userGroups/i);
            });
        });
    });

    describe("createUser factory method", () => {
        describe("successful creation with skipSourceErrors", () => {
            it("should create a user with valid properties and skip source errors", () => {
                const propsWithMissingFields = {
                    ...validUserProps,
                    email: "",
                    organisationUnits: [],
                    userRoles: [],
                    userGroups: [],
                };

                const user = User.createUser(propsWithMissingFields);

                expect(user).toBeInstanceOf(User);
                expect(user.username).toBe("johndoe");
            });

            it("should create a user for existing user without password", () => {
                const propsWithoutPassword = { ...validUserProps, password: "" };

                const user = User.createUser(propsWithoutPassword, true);

                expect(user).toBeInstanceOf(User);
                expect(user.username).toBe("johndoe");
            });

            it("should allow missing organisation units when skipSourceErrors is true", () => {
                const propsWithoutOrgUnits = { ...validUserProps, organisationUnits: [] };

                const user = User.createUser(propsWithoutOrgUnits);

                expect(user).toBeInstanceOf(User);
                expect(user.organisationUnits).toEqual([]);
            });

            it("should allow missing user roles when skipSourceErrors is true", () => {
                const propsWithoutRoles = { ...validUserProps, userRoles: [] };

                const user = User.createUser(propsWithoutRoles);

                expect(user).toBeInstanceOf(User);
                expect(user.userRoles).toEqual([]);
            });

            it("should allow missing user groups when skipSourceErrors is true", () => {
                const propsWithoutGroups = { ...validUserProps, userGroups: [] };

                const user = User.createUser(propsWithoutGroups);

                expect(user).toBeInstanceOf(User);
                expect(user.userGroups).toEqual([]);
            });

            it("should allow invalid email when skipSourceErrors is true", () => {
                const propsWithInvalidEmail = { ...validUserProps, email: "invalid-email" };

                const user = User.createUser(propsWithInvalidEmail);

                expect(user).toBeInstanceOf(User);
                expect(user.email).toBe("invalid-email");
            });
        });

        describe("validation still enforced", () => {
            it("should still validate required fields like firstName", () => {
                const propsWithoutFirstName = { ...validUserProps, firstName: "" };

                expect(() => User.createUser(propsWithoutFirstName)).toThrow(/firstName is required/i);
            });

            it("should still validate username format", () => {
                const propsWithInvalidUsername = { ...validUserProps, username: "invalid..username" };

                expect(() => User.createUser(propsWithInvalidUsername)).toThrow(/separators/i);
            });

            it("should still validate password for new users", () => {
                const propsWithInvalidPassword = { ...validUserProps, password: "weak" };

                expect(() => User.createUser(propsWithInvalidPassword, false)).toThrow(/8 characters/i);
            });
        });
    });

    describe("error message formatting", () => {
        it("should combine multiple validation errors", () => {
            const propsWithMultipleErrors = {
                ...validUserProps,
                username: "",
                firstName: "",
                surname: "",
                password: "weak",
            };

            expect(() => User.createNewUser(propsWithMultipleErrors, false)).toThrow();

            try {
                User.createNewUser(propsWithMultipleErrors, false);
            } catch (error) {
                const message = (error as Error).message;
                expect(message).toContain("username");
                expect(message).toContain("firstName");
                expect(message).toContain("surname");
                expect(message).toContain("password");
            }
        });
    });
});
