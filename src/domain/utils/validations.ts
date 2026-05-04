export function validateRequired(value: any, message: string): string | undefined {
    const isBlank = !value || (value.length !== undefined && value.length === 0);

    return isBlank ? message : undefined;
}

export function validateRegexp(value: string, regexp: RegExp, message: string): string | undefined {
    return regexp.test(value) ? undefined : message;
}

export function validateNotRegexp(value: string, regexp: RegExp, message: string): string | undefined {
    return regexp.test(value) ? message : undefined;
}

export function validateLengthMin(value: string, min: number, message: string): string | undefined {
    if (value.length < min) {
        return message;
    }
    return undefined;
}

export function validateLengthMax(value: string, max: number, message: string): string | undefined {
    if (value.length > max) {
        return message;
    }
    return undefined;
}
