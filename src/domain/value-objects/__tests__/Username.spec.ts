import { Username } from "../Username";

describe("Username value object", () => {
    describe("create method", () => {
        describe("successful creation", () => {
            it("should create a username with valid properties", () => {
                const result = Username.create("johndoe");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("johndoe");
                }
            });

            it("should allow username with valid separators", () => {
                const result = Username.create("john.doe_test@domain-name");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("john.doe_test@domain-name");
                }
            });

            it("should allow numeric characters", () => {
                const result = Username.create("user123");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user123");
                }
            });

            it("should allow mixed case letters", () => {
                const result = Username.create("UserName");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("UserName");
                }
            });
        });

        describe("required validation", () => {
            it("should return error when username is empty", () => {
                const result = Username.create("");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a username");
                }
            });

            it("should return error when username is null", () => {
                const result = Username.create(null as any);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a username");
                }
            });

            it("should return error when username is undefined", () => {
                const result = Username.create(undefined as any);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a username");
                }
            });
        });

        describe("separator validation", () => {
            it("should return error when username starts with dot", () => {
                const result = Username.create(".johndoe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username starts with underscore", () => {
                const result = Username.create("_johndoe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username starts with @", () => {
                const result = Username.create("@johndoe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username starts with dash", () => {
                const result = Username.create("-johndoe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username ends with dot", () => {
                const result = Username.create("johndoe.");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username ends with underscore", () => {
                const result = Username.create("johndoe_");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username ends with @", () => {
                const result = Username.create("johndoe@");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username ends with dash", () => {
                const result = Username.create("johndoe-");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot start or end with a separator");
                }
            });

            it("should return error when username has consecutive dots", () => {
                const result = Username.create("john..doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot have two separators in a row");
                }
            });

            it("should return error when username has consecutive underscores", () => {
                const result = Username.create("john__doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot have two separators in a row");
                }
            });

            it("should return error when username has consecutive @ symbols", () => {
                const result = Username.create("john@@doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot have two separators in a row");
                }
            });

            it("should return error when username has consecutive dashes", () => {
                const result = Username.create("john--doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot have two separators in a row");
                }
            });

            it("should return error when username has mixed consecutive separators", () => {
                const result = Username.create("john.-doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username cannot have two separators in a row");
                }
            });
        });

        describe("character validation", () => {
            it("should return error when username contains invalid characters", () => {
                const result = Username.create("john#doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username can only include . _ - or @ as separators");
                }
            });

            it("should return error when username contains $", () => {
                const result = Username.create("traore_$index");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username can only include . _ - or @ as separators");
                }
            });

            it("should return error when username contains %", () => {
                const result = Username.create("john%doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username can only include . _ - or @ as separators");
                }
            });

            it("should return error when username contains spaces", () => {
                const result = Username.create("john doe");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username can only include . _ - or @ as separators");
                }
            });

            it("should return error when username contains special characters", () => {
                const result = Username.create("john&doe*test");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username can only include . _ - or @ as separators");
                }
            });
        });

        describe("length validation", () => {
            it("should return error when username is too short", () => {
                const result = Username.create("a");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username should be at least 2 characters long");
                }
            });

            it("should allow username with exactly 2 characters", () => {
                const result = Username.create("ab");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("ab");
                }
            });

            it("should return error when username is too long", () => {
                const longUsername = "a".repeat(256);
                const result = Username.create(longUsername);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Username may not exceed 255 characters");
                }
            });

            it("should allow username with exactly 255 characters", () => {
                const maxUsername = "a".repeat(255);
                const result = Username.create(maxUsername);

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe(maxUsername);
                }
            });
        });
    });

    describe("equality", () => {
        it("should be equal when values are the same", () => {
            const username1 = Username.create("johndoe");
            const username2 = Username.create("johndoe");

            expect(username1.isSuccess()).toBe(true);
            expect(username2.isSuccess()).toBe(true);

            if (username1.isSuccess() && username2.isSuccess()) {
                expect(username1.value.data.equals(username2.value.data)).toBe(true);
            }
        });

        it("should not be equal when values are different", () => {
            const username1 = Username.create("johndoe");
            const username2 = Username.create("janedoe");

            expect(username1.isSuccess()).toBe(true);
            expect(username2.isSuccess()).toBe(true);

            if (username1.isSuccess() && username2.isSuccess()) {
                expect(username1.value.data.equals(username2.value.data)).toBe(false);
            }
        });

        it("should not be equal to undefined", () => {
            const username = Username.create("johndoe");

            expect(username.isSuccess()).toBe(true);

            if (username.isSuccess()) {
                expect(username.value.data.equals(undefined)).toBe(false);
            }
        });

        it("should not be equal to null", () => {
            const username = Username.create("johndoe");

            expect(username.isSuccess()).toBe(true);

            if (username.isSuccess()) {
                expect(username.value.data.equals(null as any)).toBe(false);
            }
        });
    });
});
