export type ValidationError<T> = {
    property: keyof T;
    value: unknown;
    errors: string[];
};

export function isValidationErrorArray<T>(value: unknown): value is ValidationError<T>[] {
    return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(
            item =>
                item &&
                typeof item === "object" &&
                "property" in item &&
                "errors" in item &&
                Array.isArray((item as any).errors)
        )
    );
}

export function makeErrorMessageFromValidationErrors<T>(errors: ValidationError<T>[]): string {
    return errors.map(e => `${String(e.property)}: ${e.errors.join(", ")}`).join(", ");
}
