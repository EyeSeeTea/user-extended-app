import { Maybe } from "../../types/utils";
import { Username } from "../value-objects/Username";
import { Password } from "../value-objects/Password";
import { Struct } from "./generic/Struct";
import { UserProps } from "./UserProps";

interface UserValidationErrors {
    username?: string;
    password?: string;
    email?: string;
    firstName?: string;
    surname?: string;
    organisationUnits?: string;
    userRoles?: string;
    userGroups?: string;
}

export class User extends Struct<UserProps>() {
    static DEFAULT_PASSWORD = "District123$";

    static createNewUser(props: UserProps, isExistingUser = true): User {
        const errors = User.validateUser(props, isExistingUser);
        if (errors) {
            throw new Error(makeErrorMessage(errors));
        }
        return new User(props);
    }

    static createUser(props: UserProps, isExistingUser = true): User {
        const errors = User.validateUser(props, isExistingUser, true);
        if (errors) {
            throw new Error(makeErrorMessage(errors));
        }
        return new User(props);
    }

    /** Validates the user properties.
     * @param props The user properties to validate.
     * @param isExistingUser Whether the user is an existing user (true) or a new user (false).
     * Used to determine if password is required.
     * @param skipSourceErrors Whether to skip validation of organisationUnits, userRoles, userGroups fields.
     * Used when loading existing users from the server that may have missing fields.
     * @returns An object containing validation errors, or undefined if there are no errors.
     */
    static validateUser(
        props: UserProps,
        isExistingUser = true,
        skipSourceErrors = false
    ): UserValidationErrors | undefined {
        const errors: UserValidationErrors = {};

        const usernameResult = Username.create(props.username);

        if (usernameResult.isError()) {
            errors.username = usernameResult.value.error.join(", ");
        }

        const passwordResult = Password.create(props.password, isExistingUser);
        if (passwordResult.isError()) {
            errors.password = passwordResult.value.error.join(", ");
        }

        for (const field of ["firstName", "surname"] as const) {
            const invalidField = User.validateRequiredStringField(props[field], field);
            if (invalidField) {
                errors[field] = invalidField;
            }
        }

        if (!skipSourceErrors) {
            const invalidEmail = User.validateEmail(props.email);
            if (invalidEmail) {
                errors.email = invalidEmail;
            }

            for (const field of ["organisationUnits", "userRoles", "userGroups"] as const) {
                const invalidField = User.validateRequiredArrayField(props[field], field);
                if (invalidField) {
                    errors[field] = invalidField;
                }
            }
        }

        return Object.keys(errors).length > 0 ? errors : undefined;
    }

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

function makeErrorMessage(message: UserValidationErrors): string {
    return Object.entries(message)
        .map(([field, error]) => `${field}: ${error}`)
        .join(", ");
}
