export const roleColumns = ["name", "description", "users"] as const;

export type RoleColumnType = typeof roleColumns[number];

export type RoleColumnSetting = {
    fieldName: RoleColumnType;
    state: "selected" | "unselected" | "selected-disabled";
    position: number;
};
