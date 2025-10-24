import { Password } from "../Password";

describe("Password value object", () => {
    describe("create method", () => {
        describe("successful creation", () => {
            it("should create a password with valid properties", () => {
                const result = Password.create("ValidPassword123!");

                result.match({
                    success: password => {
                        expect(password.value).toBe("ValidPassword123!");
                    },
                    error: () => {
                        throw new Error("Expected password creation to succeed but it failed");
                    },
                });
            });

            it("should create empty password for existing user", () => {
                const result = Password.create("", true);

                result.match({
                    success: password => {
                        expect(password.value).toBe("");
                    },
                    error: () => {
                        throw new Error("Expected password creation to succeed but it failed");
                    },
                });
            });

            it("should allow complex valid password", () => {
                const result = Password.create("MyC0mpl3x-P@ssw0rd!");

                result.match({
                    success: password => {
                        expect(password.value).toBe("MyC0mpl3x-P@ssw0rd!");
                    },
                    error: () => {
                        throw new Error("Expected password creation to succeed but it failed");
                    },
                });
            });
        });

        describe("validation errors", () => {
            it("should return error when password is missing for new user", () => {
                const result = Password.create("", false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a password");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when password is too short", () => {
                const result = Password.create("Short1!", false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Password should be at least 8 characters long");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when password is too long", () => {
                const longPassword = "a".repeat(256);
                const result = Password.create(longPassword, false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Password should be no longer than 255 characters");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when password lacks lowercase letter", () => {
                const result = Password.create("PASSWORD123!", false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Password should contain at least one lowercase letter");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when password lacks uppercase letter", () => {
                const result = Password.create("password123!", false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Password should contain at least one UPPERCASE letter");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when password lacks number", () => {
                const result = Password.create("Password!", false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Password should contain at least one number");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return error when password lacks special character", () => {
                const result = Password.create("Password123", false);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Password should have at least one special character");
                    },
                    success: () => {
                        throw new Error("Expected password validation to fail but it succeeded");
                    },
                });
            });

            it("should return multiple errors for invalid password", () => {
                const result = Password.create("weak", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    const errors = result.value.error;
                    expect(errors.length).toBeGreaterThan(1);
                    expect(errors).toContain("Password should be at least 8 characters long");
                    expect(errors).toContain("Password should contain at least one UPPERCASE letter");
                    expect(errors).toContain("Password should contain at least one number");
                    expect(errors).toContain("Password should have at least one special character");
                }
            });
        });

        describe("existing user scenarios", () => {
            it("should allow empty password for existing user", () => {
                const result = Password.create("", true);

                expect(result.isSuccess()).toBe(true);
            });

            it("should still validate non-empty password for existing user", () => {
                const result = Password.create("weak", true);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error.length).toBeGreaterThan(0);
                }
            });

            it("should accept valid password for existing user", () => {
                const result = Password.create("ValidPassword123!", true);

                result.match({
                    success: password => {
                        expect(password.value).toBe("ValidPassword123!");
                    },
                    error: () => {
                        throw new Error("Expected password creation to succeed but it failed");
                    },
                });
            });
        });
    });

    describe("generate", () => {
        it("should generate a password with default length of 16", () => {
            const password = Password.generate();

            expect(password.value.length).toBe(16);
        });

        it("should generate a password with specified length", () => {
            const password = Password.generate(20);

            expect(password.value.length).toBe(20);
        });

        it("should generate password that passes validation", () => {
            const generatedPassword = Password.generate();
            const validationResult = Password.create(generatedPassword.value, false);

            expect(validationResult.isSuccess()).toBe(true);
        });
    });

    describe("equality", () => {
        it("should be equal when values are the same", () => {
            const password1 = Password.create("ValidPassword123!");
            const password2 = Password.create("ValidPassword123!");

            if (password1.isSuccess() && password2.isSuccess()) {
                expect(password1.value.data.equals(password2.value.data)).toBe(true);
            } else {
                throw new Error("Expected both password creations to succeed but one or both failed");
            }
        });

        it("should not be equal when values are different", () => {
            const password1 = Password.create("ValidPassword123!");
            const password2 = Password.create("DifferentPassword456!");

            if (password1.isSuccess() && password2.isSuccess()) {
                expect(password1.value.data.equals(password2.value.data)).toBe(false);
            } else {
                throw new Error("Expected both password creations to succeed but one or both failed");
            }
        });
    });
});
