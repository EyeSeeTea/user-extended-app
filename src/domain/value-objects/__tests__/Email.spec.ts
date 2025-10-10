import { Email } from "../Email";

describe("Email value object", () => {
    describe("create method", () => {
        describe("successful creation", () => {
            it("should create an email with valid properties", () => {
                const result = Email.create("john.doe@example.com");

                result.match({
                    success: email => {
                        expect(email.value).toBe("john.doe@example.com");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });

            it("should allow simple email format", () => {
                const result = Email.create("user@domain.com");

                result.match({
                    success: email => {
                        expect(email.value).toBe("user@domain.com");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });

            it("should allow complex email with special characters", () => {
                const result = Email.create("user.name+tag@example.co.uk");

                result.match({
                    success: email => {
                        expect(email.value).toBe("user.name+tag@example.co.uk");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });

            it("should allow email with numbers", () => {
                const result = Email.create("user123@domain456.com");

                result.match({
                    success: email => {
                        expect(email.value).toBe("user123@domain456.com");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });

            it("should allow email with allowed special characters in local part", () => {
                const result = Email.create("user.name!#$%&'*+-/=?^_`{|}~@example.com");

                result.match({
                    success: email => {
                        expect(email.value).toBe("user.name!#$%&'*+-/=?^_`{|}~@example.com");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });

            it("should allow email with hyphens in domain", () => {
                const result = Email.create("user@sub-domain.example-site.com");

                result.match({
                    success: email => {
                        expect(email.value).toBe("user@sub-domain.example-site.com");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });

            it("should allow email with multiple domain levels", () => {
                const result = Email.create("user@mail.sub.domain.example.com");

                result.match({
                    success: email => {
                        expect(email.value).toBe("user@mail.sub.domain.example.com");
                    },
                    error: () => {
                        throw new Error("Expected email creation to succeed but it failed");
                    },
                });
            });
        });

        describe("validation errors", () => {
            it("should return error for email without @", () => {
                const result = Email.create("invalid-email");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email without domain", () => {
                const result = Email.create("user@");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email without local part", () => {
                const result = Email.create("@example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email without TLD", () => {
                const result = Email.create("user@domain");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email with spaces", () => {
                const result = Email.create("user name@example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email with spaces in domain", () => {
                const result = Email.create("user@exam ple.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email with multiple @", () => {
                const result = Email.create("user@@example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email with invalid characters", () => {
                const result = Email.create("user<>@example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email ending with dot", () => {
                const result = Email.create("user@example.com.");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email starting with dot", () => {
                const result = Email.create(".user@example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for email with consecutive dots", () => {
                const result = Email.create("user..name@example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for domain starting with hyphen", () => {
                const result = Email.create("user@-example.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for domain ending with hyphen", () => {
                const result = Email.create("user@example-.com");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for empty email", () => {
                const result = Email.create("");

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for null email", () => {
                const result = Email.create(null as any);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });

            it("should return error for undefined email", () => {
                const result = Email.create(undefined as any);

                result.match({
                    error: errors => {
                        expect(errors).toContain("Please provide a valid email");
                    },
                    success: () => {
                        throw new Error("Expected email validation to fail but it succeeded");
                    },
                });
            });
        });
    });

    describe("equality", () => {
        it("should be equal when values are the same", () => {
            const email1 = Email.create("user@example.com");
            const email2 = Email.create("user@example.com");

            if (email1.isSuccess() && email2.isSuccess()) {
                expect(email1.value.data.equals(email2.value.data)).toBe(true);
            } else {
                throw new Error("Expected both email creations to succeed but one or both failed");
            }
        });

        it("should not be equal when values are different", () => {
            const email1 = Email.create("user1@example.com");
            const email2 = Email.create("user2@example.com");

            if (email1.isSuccess() && email2.isSuccess()) {
                expect(email1.value.data.equals(email2.value.data)).toBe(false);
            } else {
                throw new Error("Expected both email creations to succeed but one or both failed");
            }
        });
    });
});
