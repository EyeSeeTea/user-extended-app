import { Username } from "../value-objects/Username";
import { Password } from "../value-objects/Password";
import { Email } from "../value-objects/Email";
import { Struct } from "./generic/Struct";
import { UserProps } from "./UserProps";
import { validateRequired } from "../utils/validations";
import { getLanguage } from "../utils/getLanguage";

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
    static createNewUser(props: UserProps, isExistingUser = true): User {
        return User.validateAndCreateUser(props, isExistingUser);
    }

    static createUser(props: UserProps, isExistingUser = true): User {
        return User.validateAndCreateUser(props, isExistingUser, true);
    }

    /** Validates the user properties.
     * @param props The user properties to validate.
     * @param isExistingUser Whether the user is an existing user (true) or a new user (false).
     * Used to determine if password is required.
     * @param skipSourceErrors Whether to skip validation of organisationUnits, userRoles, userGroups fields.
     * Used when loading existing users from the server that may have missing fields.
     * @returns An object containing validation errors, or undefined if there are no errors.
     */
    private static validateAndCreateUser(props: UserProps, isExistingUser = true, skipSourceErrors = false): User {
        const errors: UserValidationErrors = {};

        const processedProps = {
            ...props,
            dbLocale: getLanguage(props.dbLocale),
            uiLocale: getLanguage(props.uiLocale),
        };

        for (const field of ["firstName", "surname"] as const) {
            const invalidField = validateRequired(props[field], `${field} is required`);
            if (invalidField) {
                errors[field] = invalidField;
            }
        }

        const usernameResult = Username.create(props.username);

        if (usernameResult.isError()) {
            errors.username = usernameResult.value.error.join(", ");
        }

        const passwordResult = Password.create(props.password, isExistingUser);
        if (passwordResult.isError()) {
            errors.password = passwordResult.value.error.join(", ");
        }

        if (!skipSourceErrors) {
            if (props.email) {
                const emailResult = Email.create(props.email);
                if (emailResult.isError()) {
                    errors.email = emailResult.value.error.join(", ");
                }
            }

            for (const field of ["organisationUnits", "userRoles", "userGroups"] as const) {
                const invalidField = validateRequired(props[field], `Please select at least one ${field}`);
                if (invalidField) {
                    errors[field] = invalidField;
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            throw new Error(makeErrorMessage(errors));
        }

        return new User(processedProps);
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
}

function makeErrorMessage(message: UserValidationErrors): string {
    return Object.entries(message)
        .map(([field, error]) => `${field}: ${error}`)
        .join(", ");
}
