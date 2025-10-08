export type ValidationError<T> = {
    property: keyof T;
    value: unknown;
    error: string;
};
