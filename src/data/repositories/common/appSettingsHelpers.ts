import _ from "lodash";
import {
    AppSettings,
    injectInternalRules,
    parseOrgUnitFieldPolicy,
    removeInternalRules,
} from "../../../domain/entities/AppSettings";
import { Permission } from "../../../domain/entities/Permission";
import { ActionPermission } from "../../../domain/entities/ActionPermission";
import { Maybe } from "../../../types/utils";

//FIXME (NOT URGENT): shouldn't be a Maybe if Request result is compared with Codec.
// Partial, as new props can be added on next releases.
export function mergeAndAddRuntimeProps(appSettings: Maybe<Partial<AppSettings>>): AppSettings {
    const emptySettings = AppSettings.defaultSettings(appSettings ? "active" : "inactive");
    if (!appSettings) return emptySettings;

    const settingsAccess = appSettings.settingsAccess
        ? new Permission(appSettings.settingsAccess)
        : emptySettings.settingsAccess;

    const storedActionsAccess = appSettings.actionsAccess
        ? _.mapValues(appSettings.actionsAccess, p => new ActionPermission(p))
        : emptySettings.actionsAccess;

    const forcedActionsAccess = injectInternalRules(
        migrateRecord(storedActionsAccess, emptySettings.actionsAccess, (def, stored) => stored ?? def)
    );

    const newAppSettings = {
        ...emptySettings,
        ...appSettings,
        settingsAccess: settingsAccess,
        actionsAccess: forcedActionsAccess,
        organisationUnitsField: parseOrgUnitFieldPolicy(
            appSettings.organisationUnitsField,
            emptySettings.organisationUnitsField
        ),
        uiUserGroupActionsAccess: migrateRecord(
            appSettings.uiUserGroupActionsAccess,
            emptySettings.uiUserGroupActionsAccess,
            mergeEntryShallow
        ),
        uiUserRoleActionsAccess: migrateRecord(
            appSettings.uiUserRoleActionsAccess,
            emptySettings.uiUserRoleActionsAccess,
            mergeEntryShallow
        ),
        uiDashboardActionsAccess: migrateRecord(
            appSettings.uiDashboardActionsAccess,
            emptySettings.uiDashboardActionsAccess,
            mergeEntryShallow
        ),
    };

    return AppSettings.create(newAppSettings);
}

/* Ensures a record contains all keys from `defaults`, even if the stored value
 * is missing or partial. New keys added in future releases get their default
 * value automatically. `mergeEntry` decides whether to replace the whole entry
 * (for class instances) or merge fields within it (for plain objects).
 */
function migrateRecord<K extends string, V>(
    stored: Maybe<Partial<Record<K, V>>>,
    defaults: Record<K, V>,
    mergeEntry: (defaultEntry: V, storedEntry: V | undefined) => V
): Record<K, V> {
    if (!stored) return defaults;
    return _.mapValues(defaults, (defaultEntry, key) => mergeEntry(defaultEntry as V, stored[key as K])) as Record<
        K,
        V
    >;
}

function mergeEntryShallow<V extends Record<string, unknown>>(defaultEntry: V, storedEntry: V | undefined): V {
    return { ...defaultEntry, ...(storedEntry ?? ({} as V)) };
}

export function removeRuntimeLogic(appSettings: AppSettings): AppSettings {
    const updatedActionsAccess = removeInternalRules(appSettings.actionsAccess);

    return AppSettings.create({
        ...appSettings,
        actionsAccess: updatedActionsAccess,
    });
}
