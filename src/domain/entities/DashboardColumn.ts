export const dashboardColumns = ["name", "description", "owner", "users"] as const;

export type DashboardColumnType = typeof dashboardColumns[number];

export type DashboardColumnSetting = {
    fieldName: DashboardColumnType;
    state: "selected" | "unselected" | "selected-disabled";
    position: number;
};
