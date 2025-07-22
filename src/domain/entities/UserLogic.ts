import { Maybe } from "../../types/utils";
import { Struct } from "./generic/Struct";
import { UserProps } from "./UserProps";

export class UserLogic extends Struct<UserProps>() {
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
}
