import { Email } from "../Email";

describe("Email value object", () => {
    describe("create method", () => {
        describe("successful creation", () => {
            it("should create an email with valid properties", () => {
                const result = Email.create("john.doe@example.com");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("john.doe@example.com");
                }
            });

            it("should allow simple email format", () => {
                const result = Email.create("user@domain.com");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user@domain.com");
                }
            });

            it("should allow complex email with special characters", () => {
                const result = Email.create("user.name+tag@example.co.uk");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user.name+tag@example.co.uk");
                }
            });

            it("should allow email with numbers", () => {
                const result = Email.create("user123@domain456.com");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user123@domain456.com");
                }
            });

            it("should allow email with allowed special characters in local part", () => {
                const result = Email.create("user.name!#$%&'*+-/=?^_`{|}~@example.com");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user.name!#$%&'*+-/=?^_`{|}~@example.com");
                }
            });

            it("should allow email with hyphens in domain", () => {
                const result = Email.create("user@sub-domain.example-site.com");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user@sub-domain.example-site.com");
                }
            });

            it("should allow email with multiple domain levels", () => {
                const result = Email.create("user@mail.sub.domain.example.com");

                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value.data.value).toBe("user@mail.sub.domain.example.com");
                }
            });
        });

        describe("validation errors", () => {
            it("should return error for email without @", () => {
                const result = Email.create("invalid-email");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email without domain", () => {
                const result = Email.create("user@");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email without local part", () => {
                const result = Email.create("@example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email without TLD", () => {
                const result = Email.create("user@domain");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email with spaces", () => {
                const result = Email.create("user name@example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email with spaces in domain", () => {
                const result = Email.create("user@exam ple.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email with multiple @", () => {
                const result = Email.create("user@@example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email with invalid characters", () => {
                const result = Email.create("user<>@example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email ending with dot", () => {
                const result = Email.create("user@example.com.");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email starting with dot", () => {
                const result = Email.create(".user@example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for email with consecutive dots", () => {
                const result = Email.create("user..name@example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for domain starting with hyphen", () => {
                const result = Email.create("user@-example.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should return error for domain ending with hyphen", () => {
                const result = Email.create("user@example-.com");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should allow empty email", () => {
                const result = Email.create("");

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should allow null email", () => {
                const result = Email.create(null as any);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });

            it("should allow undefined email", () => {
                const result = Email.create(undefined as any);

                expect(result.isError()).toBe(true);
                if (result.isError()) {
                    expect(result.value.error).toContain("Please provide a valid email");
                }
            });
        });
    });

    describe("equality", () => {
        it("should be equal when values are the same", () => {
            const email1 = Email.create("user@example.com");
            const email2 = Email.create("user@example.com");

            expect(email1.isSuccess()).toBe(true);
            expect(email2.isSuccess()).toBe(true);

            if (email1.isSuccess() && email2.isSuccess()) {
                expect(email1.value.data.equals(email2.value.data)).toBe(true);
            }
        });

        it("should not be equal when values are different", () => {
            const email1 = Email.create("user1@example.com");
            const email2 = Email.create("user2@example.com");

            expect(email1.isSuccess()).toBe(true);
            expect(email2.isSuccess()).toBe(true);

            if (email1.isSuccess() && email2.isSuccess()) {
                expect(email1.value.data.equals(email2.value.data)).toBe(false);
            }
        });
    });
});
