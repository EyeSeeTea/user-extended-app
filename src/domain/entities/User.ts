import { Username } from "../value-objects/Username";
import { Password } from "../value-objects/Password";
import { Email } from "../value-objects/Email";
import { Struct } from "./generic/Struct";
import { UserProps } from "./UserProps";
import { validateRequired } from "../utils/validations";
import { getLanguage } from "../utils/getLanguage";
import { Either } from "./Either";
import { ValidationError } from "../errors/Errors";
import { generateUid } from "../../utils/uid";

export class User extends Struct<UserProps>() {
    static createNew(props: Omit<UserProps, "id">): Either<ValidationError<User>[], User> {
        return User.validateAndCreateUser({ ...props, id: generateUid() }, false);
    }

    static createExisted(props: UserProps): Either<ValidationError<User>[], User> {
        return User.validateAndCreateUser(props, true);
    }

    update(props: Partial<UserProps>): Either<ValidationError<User>[], User> {
        return User.validateAndCreateUser({ ...this, ...props }, false);
    }

    /** Validates the user properties.
     * @param props The user properties to validate.
     * @param isExistingUser Whether the user is an existing user (true) or a new user (false).
     * Used to determine if password is required.
     * @param skipSourceErrors Whether to skip validation of organisationUnits, userRoles, userGroups fields.
     * Used when loading existing users from the server that may have missing fields.
     * @returns Either containing validation errors or user.
     */
    private static validateAndCreateUser(
        props: UserProps,
        isExistingUser: boolean
    ): Either<ValidationError<User>[], User> {
        const processedProps = {
            ...props,
            dbLocale: getLanguage(props.dbLocale),
            uiLocale: getLanguage(props.uiLocale),
        };

        const validationErrors: ValidationError<User>[] = [
            extractErrorsFromString(
                "firstName",
                processedProps.firstName,
                validateRequired(processedProps.firstName, "First name is required")
            ),
            extractErrorsFromString(
                "surname",
                processedProps.surname,
                validateRequired(processedProps.surname, "Surname is required")
            ),
            extractErrorFromEither("username", props.username, Username.create(props.username)),
            extractErrorFromEither("password", props.password, Password.create(props.password, isExistingUser)),
        ];

        const optionalValidationErrors = isExistingUser
            ? []
            : [
                  props.email
                      ? extractErrorFromEither("email", props.email, Email.create(props.email || ""))
                      : undefined,
                  extractErrorsFromString(
                      "organisationUnits",
                      props.organisationUnits,
                      validateRequired(props.organisationUnits, "Please select at least one organisationUnits")
                  ),
                  extractErrorsFromString(
                      "userRoles",
                      props.userRoles,
                      validateRequired(props.userRoles, "Please select at least one userRoles")
                  ),
                  extractErrorsFromString(
                      "userGroups",
                      props.userGroups,
                      validateRequired(props.userGroups, "Please select at least one userGroups")
                  ),
              ];

        const allErrors = (
            [...validationErrors, ...optionalValidationErrors].filter(Boolean) as ValidationError<User>[]
        ).filter(ve => ve.errors.length > 0);

        if (allErrors.length > 0) {
            return Either.error(allErrors);
        } else {
            return Either.success(new User(processedProps));
        }
    }
}

function extractErrorsFromString(
    property: keyof User,
    value: unknown,
    validation: string | undefined
): ValidationError<User> {
    return {
        property,
        errors: validation ? [validation] : [],
        value,
    };
}

function extractErrorFromEither<T>(
    property: keyof User,
    value: unknown,
    validation: Either<string[], T>
): ValidationError<User> {
    return {
        property,
        errors: validation.match({
            success: () => [],
            error: errors => errors,
        }),
        value,
    };
}
