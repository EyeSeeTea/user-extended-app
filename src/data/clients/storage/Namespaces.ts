export const dataStoreNamespace = "user-extended-app";
export const constantPrefix = "User Extended App Storage";

export type Namespace = typeof Namespaces[keyof typeof Namespaces];

export const Namespaces = {
    VISIBLE_COLUMNS: "visible-columns",
    LOGGER: "LOGGER",
    COLUMNS_PREFERENCE: "columns-preference",
    ROLE_COLUMNS_PREFERENCE: "role-columns-preference",
};

export const NamespaceProperties: Record<Namespace, string[]> = {
    [Namespaces.VISIBLE_COLUMNS]: [],
};
