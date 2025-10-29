import { ValidationError } from "../errors/Errors";
import { validateRequired } from "../utils/validations";
import { Either } from "./Either";
import { Struct } from "./generic/Struct";
import { User } from "./User";

export enum UserColumn {
    ID = "id",
    USERNAME = "username",
    FIRST_NAME = "firstName",
    SURNAME = "surname",
    EMAIL = "email",
    PHONE_NUMBER = "phoneNumber",
    OPEN_ID = "openId",
    CREATED = "created",
    LAST_UPDATED = "lastUpdated",
    API_URL = "apiUrl",
    USER_ROLES = "userRoles",
    USER_GROUPS = "userGroups",
    ORGANISATION_UNITS = "organisationUnits",
    DATA_VIEW_ORGANISATION_UNITS = "dataViewOrganisationUnits",
    SEARCH_ORGANISATIONS_UNITS = "searchOrganisationsUnits",
    LAST_LOGIN = "lastLogin",
    STATUS = "status",
    DISABLED = "disabled",
    CREATED_BY = "createdBy",
    LAST_MODIFIED_BY = "lastModifiedBy",
    TWO_FACTOR_ENABLED = "twoFactorEnabled",
    EXTERNAL_AUTH = "externalAuth",
}

export const userColumns = Object.values(UserColumn);

type UserColumnFieldName = keyof User;

export type ColumnAttrs = {
    fieldName: UserColumnFieldName;
    state: "selected" | "unselected" | "selected-disabled";
    position: number;
};

export class Column extends Struct<ColumnAttrs>() {
    static build(attrs: ColumnAttrs): Either<ValidationError<Column>[], Column> {
        const errors = this.validateAndGetErrors(attrs);
        if (errors.length > 0) return Either.error(errors);

        return Either.success(this.create(attrs));
    }

    public static getDefaultColumns(): Column[] {
        const defaultColumns: Array<keyof User> = [
            "username",
            "firstName",
            "surname",
            "email",
            "organisationUnits",
            "lastLogin",
            "disabled",
        ];

        return defaultColumns.map((columnId, index) =>
            Column.build({ fieldName: columnId, state: "selected", position: index }).getOrThrow()
        );
    }

    private static validateAndGetErrors(attrs: ColumnAttrs): ValidationError<Column>[] {
        const idError = validateRequired(attrs.fieldName, "Column id is required");
        const stateError = validateRequired(attrs.state, "Column state is required");
        const positionError = window.isNaN(attrs.position) ? "Column position must be a valid number" : undefined;

        const idValidation: ValidationError<Column> = {
            errors: idError ? [idError] : [],
            property: "fieldName",
            value: attrs.fieldName,
        };

        const stateValidation: ValidationError<Column> = {
            errors: stateError ? [stateError] : [],
            property: "state",
            value: attrs.state,
        };

        const positionValidation: ValidationError<Column> = {
            errors: positionError ? [positionError] : [],
            property: "position",
            value: attrs.position,
        };

        return [idValidation, stateValidation, positionValidation].filter(error => error.errors.length > 0);
    }
}
