import { Either } from "../entities/Either";
import { validateRegexp } from "../utils/validations";
import { ValueObject } from "./ValueObject";

export interface EmailProps {
    value: string;
}

const EMAIL_PATTERN =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z0-9]([a-zA-Z\-0-9]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}))$/;

export class Email extends ValueObject<EmailProps> {
    public readonly value: string;

    private constructor(props: EmailProps) {
        super(props);

        this.value = props.value;
    }

    public static create(value: string): Either<string[], Email> {
        const basicEmailError = validateRegexp(value, EMAIL_PATTERN, "Please provide a valid email");

        if (basicEmailError) {
            return Either.error([basicEmailError]);
        }

        return Either.success(new Email({ value }));
    }
}
