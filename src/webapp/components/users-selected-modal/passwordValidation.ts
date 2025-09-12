import i18n from "../../../utils/i18n";

const passwordPatterns = {
    minLength: 8,
    maxLength: 34,
    lowercase: /(?=.*[a-z])/,
    uppercase: /(?=.*[A-Z])/,
    digit: /(?=.*[0-9])/,
    specialChar: /[^A-Za-z0-9]/,
} as const;

const passwordValidations = {
    hasMinLength: (password: string): boolean => password.length >= passwordPatterns.minLength,
    hasMaxLength: (password: string): boolean => password.length <= passwordPatterns.maxLength,
    hasLowercase: (password: string): boolean => passwordPatterns.lowercase.test(password),
    hasUppercase: (password: string): boolean => passwordPatterns.uppercase.test(password),
    hasDigit: (password: string): boolean => passwordPatterns.digit.test(password),
    hasSpecialChar: (password: string): boolean => passwordPatterns.specialChar.test(password),
};

export const validatePasswordRules = (password: string): string | undefined => {
    if (!password) return i18n.t("Password is required");
    // Left declared for reference
    // if (!passwordValidations.hasMinLength(password)) return i18n.t("Password must contain at least 8 characters");
    // if (!passwordValidations.hasMaxLength(password)) return i18n.t("Password must not contain more than 34 characters");
    // if (!passwordValidations.hasLowercase(password))
    //     return i18n.t("Password must contain at least one lowercase letter");
    // if (!passwordValidations.hasUppercase(password))
    //     return i18n.t("Password must contain at least one UPPERCASE letter");
    // if (!passwordValidations.hasDigit(password)) return i18n.t("Password must contain at least one digit (number)");
    // if (!passwordValidations.hasSpecialChar(password))
    //     return i18n.t("Password must contain at least one special character (non-alphanumeric)");

    return undefined;
};

export const passwordRequirements = [
    {
        key: "minLength",
        text: () => i18n.t("Contain at least 8 characters"),
        validator: passwordValidations.hasMinLength,
    },
    {
        key: "maxLength",
        text: () => i18n.t("Not contain more than 34 characters"),
        validator: passwordValidations.hasMaxLength,
    },
    {
        key: "specialChar",
        text: () => i18n.t("Contain at least one special character (non-alphanumeric)"),
        validator: passwordValidations.hasSpecialChar,
    },
    {
        key: "uppercase",
        text: () => i18n.t("Contain at least one UPPERCASE character"),
        validator: passwordValidations.hasUppercase,
    },
    {
        key: "lowercase",
        text: () => i18n.t("Contain at least one lowercase character"),
        validator: passwordValidations.hasLowercase,
    },
    {
        key: "digit",
        text: () => i18n.t("Contain at least one digit (number)"),
        validator: passwordValidations.hasDigit,
    },
] as const;
