import { Password } from "../Password";

describe("Password value object", () => {
    describe("create method", () => {
        describe("successful creation", () => {
            it("should create a password with valid properties", () => {
                const result = Password.create("ValidPassword123!");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("ValidPassword123!");
                }
            });

            it("should create empty password for existing user", () => {
                const result = Password.create("", true);

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("");
                }
            });

            it("should allow complex valid password", () => {
                const result = Password.create("MyC0mpl3x-P@ssw0rd!");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("MyC0mpl3x-P@ssw0rd!");
                }
            });
        });

        describe("validation errors", () => {
            it("should return error when password is missing for new user", () => {
                const result = Password.create("", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a password");
                }
            });

            it("should return error when password is too short", () => {
                const result = Password.create("Short1!", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Password should be at least 8 characters long");
                }
            });

            it("should return error when password is too long", () => {
                const longPassword = "a".repeat(256);
                const result = Password.create(longPassword, false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Password should be no longer than 255 characters");
                }
            });

            it("should return error when password lacks lowercase letter", () => {
                const result = Password.create("PASSWORD123!", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Password should contain at least one lowercase letter");
                }
            });

            it("should return error when password lacks uppercase letter", () => {
                const result = Password.create("password123!", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Password should contain at least one UPPERCASE letter");
                }
            });

            it("should return error when password lacks number", () => {
                const result = Password.create("Password!", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Password should contain at least one number");
                }
            });

            it("should return error when password lacks special character", () => {
                const result = Password.create("Password123", false);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Password should have at least one special character");
                }
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

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("ValidPassword123!");
                }
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

            expect(password1.isSuccess()).toBe(true);
            expect(password2.isSuccess()).toBe(true);

            if (password1.isSuccess() && password2.isSuccess()) {
                expect(password1.value.data.equals(password2.value.data)).toBe(true);
            }
        });

        it("should not be equal when values are different", () => {
            const password1 = Password.create("ValidPassword123!");
            const password2 = Password.create("DifferentPassword456!");

            expect(password1.isSuccess()).toBe(true);
            expect(password2.isSuccess()).toBe(true);

            if (password1.isSuccess() && password2.isSuccess()) {
                expect(password1.value.data.equals(password2.value.data)).toBe(false);
            }
        });
    });
});
