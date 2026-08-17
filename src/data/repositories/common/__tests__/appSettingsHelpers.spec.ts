import { describe, it, expect } from "vitest";
import { AppSettings } from "../../../../domain/entities/AppSettings";
import { ActionPermission } from "../../../../domain/entities/ActionPermission";
import { UserAction } from "../../../../domain/entities/UserAction";
import { mergeAndAddRuntimeProps } from "../appSettingsHelpers";

describe("mergeAndAddRuntimeProps", () => {
    it("returns inactive defaults when input is undefined", () => {
        const result = mergeAndAddRuntimeProps(undefined);

        expect(result.status).toBe("inactive");
        expect(result.uiUserGroupActionsAccess.filterUsersInOrgUnit).toEqual({
            visible: true,
            defaultValue: true,
        });
    });

    it("returns active defaults when input is an empty object", () => {
        const result = mergeAndAddRuntimeProps({});

        expect(result.status).toBe("active");
        expect(result.uiUserGroupActionsAccess.filterUsersInOrgUnit).toEqual({
            visible: true,
            defaultValue: true,
        });
    });

    it("fills defaultValue from defaults when stored entry only has visible (legacy storage)", () => {
        const legacyStored: Partial<AppSettings> = {
            uiUserGroupActionsAccess: {
                filterUsersInOrgUnit: { visible: false },
                filterHideNotApplicableUserGroups: { visible: true },
                filterUsers: { visible: true },
                exportCsv: { visible: true },
                exportJson: { visible: true },
            },
        };

        const result = mergeAndAddRuntimeProps(legacyStored);

        expect(result.uiUserGroupActionsAccess.filterUsersInOrgUnit).toEqual({
            visible: false,
            defaultValue: true,
        });
        expect(result.uiUserGroupActionsAccess.filterHideNotApplicableUserGroups).toEqual({
            visible: true,
            defaultValue: true,
        });
    });

    it("preserves stored defaultValue when both fields are present", () => {
        const stored: Partial<AppSettings> = {
            uiUserRoleActionsAccess: {
                filterUsersInOrgUnit: { visible: true, defaultValue: false },
                filterHideNotApplicableUserRoles: { visible: false, defaultValue: false },
                filterUsers: { visible: true },
            },
        };

        const result = mergeAndAddRuntimeProps(stored);

        expect(result.uiUserRoleActionsAccess.filterUsersInOrgUnit).toEqual({
            visible: true,
            defaultValue: false,
        });
        expect(result.uiUserRoleActionsAccess.filterHideNotApplicableUserRoles).toEqual({
            visible: false,
            defaultValue: false,
        });
    });

    it("adds missing ui action keys from defaults (forward-compatible migration)", () => {
        const storedMissingKey: Partial<AppSettings> = {
            uiDashboardActionsAccess: {
                filterUsersInOrgUnit: { visible: false, defaultValue: false },
            } as AppSettings["uiDashboardActionsAccess"],
        };

        const result = mergeAndAddRuntimeProps(storedMissingKey);

        expect(result.uiDashboardActionsAccess.filterUsersInOrgUnit).toEqual({
            visible: false,
            defaultValue: false,
        });
        expect(result.uiDashboardActionsAccess.filterUsers).toEqual({ visible: true });
        expect(result.uiDashboardActionsAccess.filterOwners).toEqual({ visible: true });
    });

    it("defaults limitPasswordActionsToUserOrgUnits to false when not stored", () => {
        const storedWithoutSetting: Partial<AppSettings> = { showOnlyActiveUsers: true };

        const result = mergeAndAddRuntimeProps(storedWithoutSetting);

        expect(result.limitPasswordActionsToUserOrgUnits).toBe(false);
    });

    it("keeps limitPasswordActionsToUserOrgUnits when stored", () => {
        const result = mergeAndAddRuntimeProps({ limitPasswordActionsToUserOrgUnits: true });

        expect(result.limitPasswordActionsToUserOrgUnits).toBe(true);
    });

    it("defaults organisationUnitsField to 'userDefined' for legacy stored settings", () => {
        const result = mergeAndAddRuntimeProps({});

        expect(result.organisationUnitsField).toBe("userDefined");
    });

    it("preserves a stored organisationUnitsField policy", () => {
        const result = mergeAndAddRuntimeProps({ organisationUnitsField: "code" });

        expect(result.organisationUnitsField).toBe("code");
    });

    it("falls back to the default organisationUnitsField when the stored value is unknown", () => {
        const stored = { organisationUnitsField: "displayName" } as unknown as Partial<AppSettings>;

        const result = mergeAndAddRuntimeProps(stored);

        expect(result.organisationUnitsField).toBe("userDefined");
    });

    it("adds the description group column to legacy stored settings, preserving the stored values", () => {
        const legacyStored: Partial<AppSettings> = {
            groupColumns: [
                { field: "name", value: "mandatory" },
                { field: "users", value: "visible" },
            ],
        };

        const result = mergeAndAddRuntimeProps(legacyStored);

        expect(result.groupColumns).toEqual([
            { field: "name", value: "mandatory" },
            { field: "description", value: "optional" },
            { field: "users", value: "visible" },
        ]);
    });

    it("preserves the stored value of the description group column", () => {
        const stored: Partial<AppSettings> = {
            groupColumns: [
                { field: "users", value: "visible" },
                { field: "description", value: "mandatory" },
                { field: "name", value: "mandatory" },
            ],
        };

        const result = mergeAndAddRuntimeProps(stored);

        expect(result.groupColumns).toEqual([
            { field: "name", value: "mandatory" },
            { field: "description", value: "mandatory" },
            { field: "users", value: "visible" },
        ]);
    });

    it("fills missing actionsAccess entries from defaults", () => {
        const defaults = AppSettings.defaultSettings("active");
        const partialActionsAccess = { ...defaults.actionsAccess };
        delete (partialActionsAccess as Partial<typeof partialActionsAccess>)[UserAction.DETAILS];

        const result = mergeAndAddRuntimeProps({ actionsAccess: partialActionsAccess });

        expect(result.actionsAccess[UserAction.DETAILS]).toBeInstanceOf(ActionPermission);
        expect(result.actionsAccess[UserAction.EDIT]).toBeInstanceOf(ActionPermission);
    });
});
