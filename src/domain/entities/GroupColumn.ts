export const groupColumns = ["name", "description", "users"] as const;

export type GroupColumnType = typeof groupColumns[number];

export type GroupColumnSetting = {
    fieldName: GroupColumnType;
    state: "selected" | "unselected" | "selected-disabled";
    position: number;
};
