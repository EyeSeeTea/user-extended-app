import { Either } from "../entities/Either";
import {
    validateLengthMax,
    validateLengthMin,
    validateNotRegexp,
    validateRegexp,
    validateRequired,
} from "../utils/validations";
import { ValueObject } from "./ValueObject";

export interface UsernameProps {
    value: string;
}

export class Username extends ValueObject<UsernameProps> {
    public readonly value: string;

    private constructor(props: UsernameProps) {
        super(props);

        this.value = props.value;
    }

    public static create(value: string, isExistingUser = false): Either<string[], Username> {
        // For existing users, wrong username is allowed
        if (isExistingUser) {
            return Either.success(new Username({ value }));
        }

        const requiredError = validateRequired(value, "Please provide a username");

        if (requiredError) {
            return Either.error([requiredError]);
        }

        // DHIS2 accepts usernames starting with a dot, so existing users
        // with such usernames must remain editable through this app.
        const startEndRegex = isExistingUser ? /^[_@-]|[._@-]$/ : /^[._@-]|[._@-]$/;
        const startError = validateNotRegexp(value, startEndRegex, "Username cannot start or end with a separator");
        const doubleError = validateNotRegexp(value, /([._@-]){2,}/, "Username cannot have two separators in a row");
        // Existing users also skip the character-set check: DHIS2 accepts
        // characters outside this set, so legacy accounts may contain them.
        const charError = isExistingUser
            ? undefined
            : validateRegexp(value, /^[a-zA-Z0-9._@-]+$/, "Username can only include . _ - or @ as separators");

        const minLengthError = validateLengthMin(value, 2, "Username should be at least 2 characters long");
        const maxLengthError = validateLengthMax(value, 255, "Username may not exceed 255 characters");

        const errors = [startError, doubleError, charError, minLengthError, maxLengthError].filter(
            error => error !== undefined
        ) as string[];

        if (errors.length > 0) {
            return Either.error(errors);
        }

        return Either.success(new Username({ value }));
    }
}
