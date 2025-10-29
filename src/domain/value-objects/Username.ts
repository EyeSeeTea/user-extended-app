import { Either } from "../entities/Either";
import { validateLengthMax, validateLengthMin, validateNotRegexp, validateRequired } from "../utils/validations";
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

    public static create(value: string): Either<string[], Username> {
        const requiredError = validateRequired(value, "Please provide a username");

        if (requiredError) {
            return Either.error([requiredError]);
        }

        const startError = validateNotRegexp(value, /^[._@-]|[._@-]$/, "Username cannot start or end with a separator");
        const doubleError = validateNotRegexp(value, /([._@-]){2,}/, "Username cannot have two separators in a row");
        /* 
           In the USERS app they have this validation rule, but the API allows these characters
           and since we have users that already use them, we cannot apply this validation
           so I'm leaving it commented out for future reference
        */

        // const charError = validateRegexp(
        //     value,
        //     /^[a-zA-Z0-9._@-]+$/,
        //     "Username can only include . _ - or @ as separators"
        // );

        const minLengthError = validateLengthMin(value, 2, "Username should be at least 2 characters long");
        const maxLengthError = validateLengthMax(value, 255, "Username may not exceed 255 characters");

        const errors = [startError, doubleError, minLengthError, maxLengthError].filter(
            error => error !== undefined
        ) as string[];

        if (errors.length > 0) {
            return Either.error(errors);
        }

        return Either.success(new Username({ value: value }));
    }
}
