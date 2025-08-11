import i18n from "../../../locales";

export const PASSWORD_PATTERNS = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 34,
    LOWERCASE: /(?=.*[a-z])/,
    UPPERCASE: /(?=.*[A-Z])/,
    DIGIT: /(?=.*[0-9])/,
    SPECIAL_CHAR: /[^A-Za-z0-9]/,
} as const;

export const passwordValidations = {
    hasMinLength: (password: string): boolean => password.length >= PASSWORD_PATTERNS.MIN_LENGTH,
    hasMaxLength: (password: string): boolean => password.length <= PASSWORD_PATTERNS.MAX_LENGTH,
    hasLowercase: (password: string): boolean => PASSWORD_PATTERNS.LOWERCASE.test(password),
    hasUppercase: (password: string): boolean => PASSWORD_PATTERNS.UPPERCASE.test(password),
    hasDigit: (password: string): boolean => PASSWORD_PATTERNS.DIGIT.test(password),
    hasSpecialChar: (password: string): boolean => PASSWORD_PATTERNS.SPECIAL_CHAR.test(password),
};

export const validatePasswordRules = (password: string): string | undefined => {
    if (!password) return i18n.t("Password is required");
    if (!passwordValidations.hasMinLength(password)) return i18n.t("Password must contain at least 8 characters");
    if (!passwordValidations.hasMaxLength(password)) return i18n.t("Password must not contain more than 34 characters");
    if (!passwordValidations.hasLowercase(password))
        return i18n.t("Password must contain at least one lowercase letter");
    if (!passwordValidations.hasUppercase(password))
        return i18n.t("Password must contain at least one UPPERCASE letter");
    if (!passwordValidations.hasDigit(password)) return i18n.t("Password must contain at least one digit (number)");
    if (!passwordValidations.hasSpecialChar(password))
        return i18n.t("Password must contain at least one special character (non-alphanumeric)");

    return undefined;
};

export const PASSWORD_REQUIREMENTS = [
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
