import { Maybe } from "../../types/utils";
import { Struct } from "./generic/Struct";
import { UserProps } from "./UserProps";

export class User extends Struct<UserProps>() {
    static DEFAULT_PASSWORD = "District123$";

    static setDefaultLanguage(language: Maybe<string>): string {
        return language || "en";
    }

    static validateHasRequiredFields(users: UserProps[]): boolean {
        return users.every(
            user => user.organisationUnits.length > 0 && user.userRoles.length > 0 && user.userGroups.length > 0
        );
    }

    static validateUniqueOpenId(users: UserProps[]): boolean {
        const allOpenIds = users.filter(user => Boolean(user.openId)).map(user => user.openId);
        return new Set(allOpenIds).size === allOpenIds.length;
    }

    /**
     * Generates a random password with a specified length.
     *
     * Use the generated password as a temporary one that the user must change after logging in.
     *
     * The password will contain at least one character from each of the following categories:
     * - Lowercase letters
     * - Uppercase letters
     * - Numbers
     * - Special characters
     *
     * @param {number} [length=16] - The length of the generated password. Defaults to 16 if not specified.
     * @returns {string} The generated random password.
     */
    static generateRandomPassword(length = 16): string {
        const charset = {
            lower: "abcdefghijklmnopqrstuvwxyz",
            upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            number: "0123456789",
            special: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
        };

        const getRandomNumber = () => {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            return array[0] as number;
        };

        const getRandomChar = (str: string): string => {
            const rand = getRandomNumber();
            const char = str.charAt(rand % str.length);
            return char;
        };

        const requiredChars = [
            getRandomChar(charset.lower),
            getRandomChar(charset.upper),
            getRandomChar(charset.number),
            getRandomChar(charset.special),
        ];

        const allChars = charset.lower + charset.upper + charset.number + charset.special;
        const password = Array.from({ length: length - requiredChars.length }, () => getRandomChar(allChars)).concat(
            requiredChars
        );

        const shuffledPassword: string = password
            .map(char => ({ char, rand: getRandomNumber() % length }))
            .sort((a, b) => a.rand - b.rand)
            .map(({ char }) => char)
            .join("");

        return shuffledPassword;
    }

    static validateUsername(username: string): string | undefined {
        if (!username) {
            return "Please provide a username";
        }
        if (/^[._@-]|[._@-]$/.test(username)) {
            return "Username cannot start or end with a separator";
        }
        if (/([._@-]){2,}/.test(username)) {
            return "Username cannot have two separators in a row";
        }
        if (!/^[a-zA-Z0-9._@-]+$/.test(username)) {
            return "Username can only include . _ - or @ as separators";
        }
        if (username.length < 2) {
            return "Username should be at least 2 characters long";
        }
        if (username.length > 255) {
            return "Username may not exceed 255 characters";
        }

        return undefined;
    }

    static validatePassword(password: string, isExistingUser = false): string | undefined {
        if (isExistingUser && !password) {
            return undefined;
        }
        if (!password) {
            return "Please provide a password";
        }
        if (password.length < 8) {
            return "Password should be at least 8 characters long";
        }
        if (password.length > 255) {
            return "Password should be no longer than 255 characters";
        }
        if (!/.*[a-z]/.test(password)) {
            return "Password should contain at least one lowercase letter";
        }
        if (!/.*[A-Z]/.test(password)) {
            return "Password should contain at least one UPPERCASE letter";
        }
        if (!/.*[0-9]/.test(password)) {
            return "Password should contain at least one number";
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            return "Password should have at least one special character";
        }

        return undefined;
    }

    static validateEmail(email: string): string | undefined {
        if (!email) {
            return undefined;
        }
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!emailRegex.test(email)) {
            return "Please provide a valid email";
        }

        return undefined;
    }

    static validateRequiredArrayField(field: any[], fieldName: string): string | undefined {
        if (!field || field.length === 0) {
            return `Please select at least one ${fieldName}`;
        }

        return undefined;
    }

    static validateRequiredStringField(field: string, fieldName: string): string | undefined {
        if (!field || field.trim().length === 0) {
            return `${fieldName} is required`;
        }

        return undefined;
    }
}
