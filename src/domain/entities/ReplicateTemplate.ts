import _ from "lodash";
import { Struct } from "./generic/Struct";
import { User } from "./User";

export type ReplicateTemplateProps = {
    replicateCount: string;
    usernameTemplate: string;
    passwordTemplate: string;
};

export class ReplicateTemplateValidationError extends Error {
    constructor(message: string, public errors?: ReplicateTemplateErrors) {
        super(message);
        this.name = "ReplicateTemplateValidationError";
    }
}

export type ReplicateTemplateErrors = { replicateCount?: string; usernameTemplate?: string; passwordTemplate?: string };

export class ReplicateTemplate extends Struct<ReplicateTemplateProps>() {
    private static indexString = "$index";
    private static minCount = 1;
    private static maxCount = 100;

    constructor(props: ReplicateTemplateProps, existingUsernames: string[]) {
        super(props);

        const errors = ReplicateTemplate.validateReplicateTemplate(props, existingUsernames);
        if (errors.replicateCount || errors.usernameTemplate || errors.passwordTemplate) {
            const errorMessage = Object.entries(errors)
                .map(([field, error]) => `${field}: ${error}`)
                .join(", ");
            throw new ReplicateTemplateValidationError(errorMessage, errors);
        }
    }

    static getFromTemplate(template: string, index: number): string {
        return template.replace(/\$index/g, index.toString());
    }

    static validateReplicateCount(value: string): string | undefined {
        if (!value) {
            return `Please provide a number between ${this.minCount} and ${this.maxCount}`;
        }
        if (!/^\d+$/.test(value)) {
            return "Value must be a valid integer";
        }
        const numericValue = Number(value);
        if (numericValue < this.minCount || numericValue > this.maxCount) {
            return `Value must be between ${this.minCount} and ${this.maxCount}`;
        }

        return undefined;
    }

    private static validateIndex(value: string, count: number): string | undefined {
        if (count > 1 && !value.includes(this.indexString)) {
            return `Username must contain ${this.indexString} when replicating multiple users`;
        }
        return undefined;
    }

    static validateUsernameTemplate(value: string, existingUsernames: string[], count: number): string | undefined {
        if (!value) {
            return "Please provide a username";
        }

        const indexError = this.validateIndex(value, count);
        if (indexError) {
            return indexError;
        }

        if (existingUsernames.includes(value)) {
            return "User already exists";
        }

        const usernameValidationError = User.validateUsername(this.getFromTemplate(value, count));
        if (usernameValidationError) {
            return usernameValidationError;
        }

        const usernameTemplate = _.times(count, index => this.getFromTemplate(value, index + 1));
        if (_.intersection(usernameTemplate, existingUsernames).length > 0) {
            return "Template will conflict with existing usernames";
        }

        return undefined;
    }

    static validatePasswordTemplate(value: string): string | undefined {
        if (!value) {
            return "Please provide a password";
        }

        // minCount is used to avoid having a mix of valid and invalid passwords
        const validPasswordError = User.validatePassword(this.getFromTemplate(value, this.minCount), false);
        if (validPasswordError) {
            return validPasswordError;
        }

        return undefined;
    }

    static validateReplicateTemplate(
        template: ReplicateTemplateProps,
        existingUsernames: string[]
    ): ReplicateTemplateErrors {
        const errors: ReplicateTemplateErrors = {};

        const countValidationError = this.validateReplicateCount(template.replicateCount);
        if (countValidationError) {
            errors.replicateCount = countValidationError;
        }

        const usernameValidationError = this.validateUsernameTemplate(
            template.usernameTemplate,
            existingUsernames,
            Number(template.replicateCount)
        );
        if (usernameValidationError) {
            errors.usernameTemplate = usernameValidationError;
        }

        const passwordValidationError = this.validatePasswordTemplate(template.passwordTemplate);
        if (passwordValidationError) {
            errors.passwordTemplate = passwordValidationError;
        }

        return errors;
    }
}
