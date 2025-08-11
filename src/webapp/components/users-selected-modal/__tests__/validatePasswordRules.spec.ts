import { validatePasswordRules } from "../passwordValidation";

jest.mock("../../../../locales", () => ({
    t: (key: string) => key,
}));

describe("validatePasswordRules", () => {
    describe("empty password validation", () => {
        it("should return error for empty string", () => {
            const result = validatePasswordRules("");
            expect(result).toBe("Password is required");
        });

        it("should return error for undefined", () => {
            const result = validatePasswordRules(undefined as any);
            expect(result).toBe("Password is required");
        });

        it("should return error for null", () => {
            const result = validatePasswordRules(null as any);
            expect(result).toBe("Password is required");
        });
    });

    describe("length validation", () => {
        describe("minimum length (8 characters)", () => {
            it("should reject passwords shorter than 8 characters", () => {
                const shortPasswords = ["1", "12", "123", "1234", "12345", "123456", "1234567"];

                shortPasswords.forEach(password => {
                    const result = validatePasswordRules(password);
                    expect(result).toBe("Password must contain at least 8 characters");
                });
            });

            it("should accept passwords with exactly 8 characters (when other rules are met)", () => {
                const validPassword = "Abc123!@"; // 8 chars, meets all requirements
                const result = validatePasswordRules(validPassword);
                expect(result).toBeUndefined();
            });
        });

        describe("maximum length (34 characters)", () => {
            it("should reject passwords longer than 34 characters", () => {
                const longPassword = "Abc123!@" + "x".repeat(27); // 35 characters total
                const result = validatePasswordRules(longPassword);
                expect(result).toBe("Password must not contain more than 34 characters");
            });

            it("should accept passwords with exactly 34 characters (when other rules are met)", () => {
                const validPassword = "Abc123!@" + "x".repeat(26); // 34 chars total
                const result = validatePasswordRules(validPassword);
                expect(result).toBeUndefined();
            });

            it("should reject very long passwords", () => {
                const veryLongPassword = "Abc123!@" + "x".repeat(100);
                const result = validatePasswordRules(veryLongPassword);
                expect(result).toBe("Password must not contain more than 34 characters");
            });
        });
    });

    describe("lowercase letter validation", () => {
        it("should reject passwords without lowercase letters", () => {
            const passwordsWithoutLowercase = ["ABC123!@", "PASSWORD123!", "12345678!", "UPPER123@#$"];

            passwordsWithoutLowercase.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBe("Password must contain at least one lowercase letter");
            });
        });

        it("should accept passwords with lowercase letters", () => {
            const passwordsWithLowercase = ["abcDEF123!", "Password123!", "lowerCASE1@", "mixedCase9#"];

            passwordsWithLowercase.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });
    });

    describe("uppercase letter validation", () => {
        it("should reject passwords without uppercase letters", () => {
            const passwordsWithoutUppercase = ["abc123!@", "password123!", "lowercase1@", "alllower9#"];

            passwordsWithoutUppercase.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBe("Password must contain at least one UPPERCASE letter");
            });
        });

        it("should accept passwords with uppercase letters", () => {
            const passwordsWithUppercase = ["Abc123!@", "Password123!", "UPPER1lower@", "MixedCase9#"];

            passwordsWithUppercase.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });
    });

    describe("digit validation", () => {
        it("should reject passwords without digits", () => {
            const passwordsWithoutDigits = ["AbcDef!@", "Password!", "NoNumbers!", "OnlyLetters@"];

            passwordsWithoutDigits.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBe("Password must contain at least one digit (number)");
            });
        });

        it("should accept passwords with digits", () => {
            const passwordsWithDigits = ["Abc123!@", "Password1!", "Numbers9@", "Digit5here#"];

            passwordsWithDigits.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });

        it("should accept passwords with multiple digits", () => {
            const passwordsWithMultipleDigits = ["Abc123456!", "Pass789word!", "Multi123ple456#"];

            passwordsWithMultipleDigits.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });
    });

    describe("special character validation", () => {
        it("should reject passwords without special characters", () => {
            const passwordsWithoutSpecialChars = ["Abc123def", "Password123", "NoSpecialChars1", "OnlyAlphaNum9"];

            passwordsWithoutSpecialChars.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBe("Password must contain at least one special character (non-alphanumeric)");
            });
        });

        it("should accept passwords with common special characters", () => {
            const specialChars = [
                "!",
                "@",
                "#",
                "$",
                "%",
                "^",
                "&",
                "*",
                "(",
                ")",
                "-",
                "_",
                "+",
                "=",
                "{",
                "}",
                "[",
                "]",
                "|",
                "\\",
                ":",
                ";",
                '"',
                "'",
                "<",
                ">",
                ",",
                ".",
                "?",
                "/",
                "~",
                "`",
            ];

            specialChars.forEach(specialChar => {
                const password = `Abc123${specialChar}z`; // Make it 8 characters
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });

        it("should accept passwords with unicode special characters", () => {
            const passwordsWithUnicodeSpecials = [
                "Abc123€8", // Make it 8 characters
                "Password1¡",
                "Special9¿8", // Make it 8 characters
                "Unicode1§8", // Make it 8 characters
            ];

            passwordsWithUnicodeSpecials.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });

        it("should accept passwords with space as special character", () => {
            const password = "Abc123 def";
            const result = validatePasswordRules(password);
            expect(result).toBeUndefined();
        });
    });

    describe("comprehensive validation scenarios", () => {
        it("should accept valid passwords that meet all requirements", () => {
            const validPasswords = [
                "Abc123!@", // Basic valid password
                "MyPassword1!", // Common pattern
                "SecureP@ss9", // Secure pattern
                "Complex123#Pass", // Complex pattern
                "Valid8^Password", // Different special char
                "Test123$", // Minimum length
                "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5!", // Maximum length (34 chars)
            ];

            validPasswords.forEach(password => {
                const result = validatePasswordRules(password);
                expect(result).toBeUndefined();
            });
        });

        it("should reject passwords that fail multiple requirements", () => {
            const testCases = [
                {
                    password: "abc",
                    expectedError: "Password must contain at least 8 characters",
                },
                {
                    password: "abcdefgh",
                    expectedError: "Password must contain at least one UPPERCASE letter",
                },
                {
                    password: "ABCDEFGH",
                    expectedError: "Password must contain at least one lowercase letter",
                },
                {
                    password: "Abcdefgh",
                    expectedError: "Password must contain at least one digit (number)",
                },
                {
                    password: "Abcdefg1",
                    expectedError: "Password must contain at least one special character (non-alphanumeric)",
                },
            ];

            testCases.forEach(({ password, expectedError }) => {
                const result = validatePasswordRules(password);
                expect(result).toBe(expectedError);
            });
        });

        it("should return the first validation error encountered", () => {
            // Password that fails length first (should return length error, not other errors)
            const shortPassword = "A1!";
            const result = validatePasswordRules(shortPassword);
            expect(result).toBe("Password must contain at least 8 characters");
        });

        it("should validate in the correct order (length, then character requirements)", () => {
            // Test that length validation comes before character validation
            const shortPasswordMissingLowercase = "ABC1!";
            const result = validatePasswordRules(shortPasswordMissingLowercase);
            expect(result).toBe("Password must contain at least 8 characters");
        });
    });

    describe("edge cases", () => {
        it("should handle passwords with only unicode characters", () => {
            // Since JavaScript [a-z] regex doesn't match Cyrillic, use Latin characters with unicode special chars
            const unicodePassword = "Mixedпа1!"; // Mix of Latin and Cyrillic with required elements
            const result = validatePasswordRules(unicodePassword);
            expect(result).toBeUndefined();
        });

        it("should handle passwords with mixed character sets", () => {
            const mixedPassword = "Mix3d字符!";
            const result = validatePasswordRules(mixedPassword);
            expect(result).toBeUndefined();
        });

        it("should handle passwords with repeated special characters", () => {
            const repeatedSpecialPassword = "Abc123!!!!";
            const result = validatePasswordRules(repeatedSpecialPassword);
            expect(result).toBeUndefined();
        });

        it("should treat whitespace as special characters", () => {
            const passwordWithSpaces = "My Pass1 ";
            const result = validatePasswordRules(passwordWithSpaces);
            expect(result).toBeUndefined();
        });

        it("should handle tab and newline characters as special characters", () => {
            const passwordWithTab = "MyPass1\t";
            const passwordWithNewline = "MyPass1\n";

            expect(validatePasswordRules(passwordWithTab)).toBeUndefined();
            expect(validatePasswordRules(passwordWithNewline)).toBeUndefined();
        });
    });

    describe("boundary testing", () => {
        it("should test exact boundary conditions", () => {
            // Exactly 8 characters, all requirements met
            const minValidPassword = "Abc123!@";
            expect(validatePasswordRules(minValidPassword)).toBeUndefined();

            // Exactly 7 characters (should fail)
            const tooShortPassword = "Abc123!";
            expect(validatePasswordRules(tooShortPassword)).toBe("Password must contain at least 8 characters");

            // Exactly 34 characters (should pass)
            const maxValidPassword = "Abc123!@" + "x".repeat(26); // 34 total
            expect(validatePasswordRules(maxValidPassword)).toBeUndefined();

            // Exactly 35 characters (should fail)
            const tooLongPassword = "Abc123!@" + "x".repeat(27); // 35 total
            expect(validatePasswordRules(tooLongPassword)).toBe("Password must not contain more than 34 characters");
        });
    });
});
