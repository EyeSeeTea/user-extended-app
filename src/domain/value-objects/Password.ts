import { Either } from "../entities/Either";
import { validateLengthMax, validateLengthMin, validateRegexp, validateRequired } from "../utils/validations";
import { ValueObject } from "./ValueObject";

export interface PasswordProps {
    value: string;
}

export class Password extends ValueObject<PasswordProps> {
    public readonly value: string;

    private constructor(props: PasswordProps) {
        super(props);

        this.value = props.value;
    }

    public static create(value: string, isExistingUser = false): Either<string[], Password> {
        // For existing users, empty password is allowed
        if (isExistingUser && !value) {
            return Either.success(new Password({ value }));
        }

        const requiredError = validateRequired(value, "Please provide a password");

        if (requiredError) {
            return Either.error([requiredError]);
        }

        const minLengthError = validateLengthMin(value, 8, "Password should be at least 8 characters long");
        const maxLengthError = validateLengthMax(value, 255, "Password should be no longer than 255 characters");

        const lowercaseError = validateRegexp(
            value,
            /.*[a-z]/,
            "Password should contain at least one lowercase letter"
        );

        const uppercaseError = validateRegexp(
            value,
            /.*[A-Z]/,
            "Password should contain at least one UPPERCASE letter"
        );

        const numberError = validateRegexp(value, /.*[0-9]/, "Password should contain at least one number");

        const specialCharError = validateRegexp(
            value,
            /[^A-Za-z0-9]/,
            "Password should have at least one special character"
        );

        const errors = [
            minLengthError,
            maxLengthError,
            lowercaseError,
            uppercaseError,
            numberError,
            specialCharError,
        ].filter(error => error !== undefined) as string[];

        if (errors.length > 0) {
            return Either.error(errors);
        }

        return Either.success(new Password({ value }));
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
     */
    static generate(length = 16): Password {
        const charset = {
            lower: "abcdefghijklmnopqrstuvwxyz",
            upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            number: "0123456789",
            special: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
        };

        const getRandomChar = (characters: string): string => {
            const bytes = new Uint8Array(1);

            const isNode = typeof process !== "undefined" && process.versions?.node;

            if (isNode) {
                require("crypto").randomFillSync(bytes);
            } else {
                crypto.getRandomValues(bytes);
            }

            const index = Math.floor(((bytes[0] as number) / 256) * characters.length);
            return characters.charAt(index);
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

        // Simple shuffle
        const shuffledPassword = password.sort(() => Math.random() - 0.5).join("");

        return Password.create(shuffledPassword).getOrThrow();
    }
}
