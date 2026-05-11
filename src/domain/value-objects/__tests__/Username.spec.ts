import { Username } from "../Username";

describe("Username value object", () => {
    describe("create method", () => {
        describe("successful creation", () => {
            it("should create a username with valid properties", () => {
                const result = Username.create("johndoe");

                result.match({
                    success: username => {
                        expect(username.value).toBe("johndoe");
                    },
                    error: () => {
                        throw new Error("Expected username creation to succeed but it failed");
                    },
                });
            });

            it("should allow username with valid separators", () => {
                const result = Username.create("john.doe_test@domain-name");

                result.match({
                    success: username => {
                        expect(username.value).toBe("john.doe_test@domain-name");
                    },
                    error: () => {
                        throw new Error("Expected username creation to succeed but it failed");
                    },
                });
            });

            it("should allow numeric characters", () => {
                const result = Username.create("user123");

                result.match({
                    success: username => {
                        expect(username.value).toBe("user123");
                    },
                    error: () => {
                        throw new Error("Expected username creation to succeed but it failed");
                    },
                });
            });

            it("should allow mixed case letters", () => {
                const result = Username.create("UserName");

                result.match({
                    success: username => {
                        expect(username.value).toBe("UserName");
                    },
                    error: () => {
                        throw new Error("Expected username creation to succeed but it failed");
                    },
                });
            });
        });

        describe("required validation", () => {
            it("should return error when username is empty", () => {
                const result = Username.create("");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a username");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username is null", () => {
                const result = Username.create(null as any);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a username");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username is undefined", () => {
                const result = Username.create(undefined as any);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a username");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });
        });

        describe("separator validation", () => {
            it("should return error when username starts with dot", () => {
                const result = Username.create(".johndoe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username starts with underscore", () => {
                const result = Username.create("_johndoe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username starts with @", () => {
                const result = Username.create("@johndoe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username starts with dash", () => {
                const result = Username.create("-johndoe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username ends with dot", () => {
                const result = Username.create("johndoe.");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username ends with underscore", () => {
                const result = Username.create("johndoe_");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username ends with @", () => {
                const result = Username.create("johndoe@");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username ends with dash", () => {
                const result = Username.create("johndoe-");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot start or end with a separator");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username has consecutive dots", () => {
                const result = Username.create("john..doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot have two separators in a row");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username has consecutive underscores", () => {
                const result = Username.create("john__doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot have two separators in a row");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username has consecutive @ symbols", () => {
                const result = Username.create("john@@doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot have two separators in a row");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username has consecutive dashes", () => {
                const result = Username.create("john--doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot have two separators in a row");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username has mixed consecutive separators", () => {
                const result = Username.create("john.-doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username cannot have two separators in a row");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });
        });

        describe("character validation", () => {
            it("should return error when username contains invalid characters", () => {
                const result = Username.create("john#doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username can only include . _ - or @ as separators");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username contains $", () => {
                const result = Username.create("traore_$index");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username can only include . _ - or @ as separators");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username contains %", () => {
                const result = Username.create("john%doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username can only include . _ - or @ as separators");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username contains spaces", () => {
                const result = Username.create("john doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username can only include . _ - or @ as separators");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username contains a forward slash", () => {
                const result = Username.create("john/doe");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username can only include . _ - or @ as separators");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when username contains special characters", () => {
                const result = Username.create("john&doe*test");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username can only include . _ - or @ as separators");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });
        });

        describe("existing user (permissive) validation", () => {
            it("should allow usernames with otherwise invalid characters for existing users", () => {
                const result = Username.create("john/doe", true);

                result.match({
                    success: username => {
                        expect(username.value).toBe("john/doe");
                    },
                    error: () => {
                        throw new Error("Expected permissive username validation to succeed but it failed");
                    },
                });
            });

            it("should allow usernames with spaces for existing users", () => {
                const result = Username.create("john doe", true);

                expect(result.isSuccess()).toBe(true);
            });

            it("should allow usernames starting with a dot for existing users", () => {
                const result = Username.create(".johndoe", true);

                expect(result.isSuccess()).toBe(true);
            });

            it("should still reject empty usernames for existing users", () => {
                const result = Username.create("", true);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a username");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });

            it("should still enforce length bounds for existing users", () => {
                const result = Username.create("a", true);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username should be at least 2 characters long");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
            });
        });

        describe("length validation", () => {
            it("should return error when username is too short", () => {
                const result = Username.create("a");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username should be at least 2 characters long");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
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

                result.match({
                    error: errors => {
                        expect(errors).toContain("Username may not exceed 255 characters");
                    },
                    success: () => {
                        throw new Error("Expected username validation to fail but it succeeded");
                    },
                });
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

            if (username1.isSuccess() && username2.isSuccess()) {
                expect(username1.value.data.equals(username2.value.data)).toBe(true);
            } else {
                throw new Error("Expected both username creations to succeed but one or both failed");
            }
        });

        it("should not be equal when values are different", () => {
            const username1 = Username.create("johndoe");
            const username2 = Username.create("janedoe");

            expect(username1.isSuccess()).toBe(true);
            expect(username2.isSuccess()).toBe(true);

            if (username1.isSuccess() && username2.isSuccess()) {
                expect(username1.value.data.equals(username2.value.data)).toBe(false);
            } else {
                throw new Error("Expected both username creations to succeed but one or both failed");
            }
        });

        it("should not be equal to undefined", () => {
            const username = Username.create("johndoe");

            username.match({
                success: usernameObj => {
                    expect(usernameObj.equals(undefined)).toBe(false);
                },
                error: () => {
                    throw new Error("Expected username creation to succeed but it failed");
                },
            });
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
