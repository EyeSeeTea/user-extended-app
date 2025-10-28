import { ValidationError } from "../errors/Errors";

export const validationErrorsToString = <T>(errors: ValidationError<T>[]): string => {
    return errors
        .map(error => error.errors)
        .flat()
        .join("; ");
};
