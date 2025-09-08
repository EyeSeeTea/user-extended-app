import _ from "lodash";
import {
    ActionsPermissions,
    AppSettings,
    injectInternalRules,
    removeInternalRules,
} from "../../../domain/entities/AppSettings";
import { Permission } from "../../../domain/entities/Permission";
import { ActionPermission } from "../../../domain/entities/ActionPermission";
import { getKeys, Maybe } from "../../../types/utils";

//FIXME (NOT URGENT): shouldn't be a Maybe if Request result is compared with Codec.
// Partial, as new props can be added on next releases.
export function mergeAndAddRuntimeProps(appSettings: Maybe<Partial<AppSettings>>): AppSettings {
    const emptySettings = AppSettings.defaultSettings();
    if (!appSettings) return emptySettings;

    const settingsAccess = appSettings.settingsAccess
        ? new Permission(appSettings.settingsAccess)
        : emptySettings.settingsAccess;

    const actionsAccess = appSettings.actionsAccess
        ? _.mapValues(appSettings.actionsAccess, p => new ActionPermission(p))
        : emptySettings.actionsAccess;

    const forcedActionsAccess = injectInternalRules(migrateNewerActions(actionsAccess));
    const newAppSettings = {
        ...emptySettings,
        ...appSettings,
        settingsAccess: settingsAccess,
        actionsAccess: forcedActionsAccess,
    };

    return AppSettings.create(newAppSettings);
}

/* New actions may be added in the future, so we need to ensure that
 the actionsAccess object contains all actions, even if they are not defined in the appSettings
 that could be already saved.
 */
function migrateNewerActions(actionsAccess: ActionsPermissions): ActionsPermissions {
    const newActionsAccess = AppSettings.defaultSettings().actionsAccess;

    const newerActions = getKeys(newActionsAccess);
    const currentActions = getKeys(actionsAccess);

    const actionsToMigrate = newerActions.filter(action => !currentActions.includes(action));
    if (actionsToMigrate.length === 0) return actionsAccess;

    const newActions = _.pick(newActionsAccess, actionsToMigrate);

    return {
        ...actionsAccess,
        ...newActions,
    };
}

export function removeRuntimeLogic(appSettings: AppSettings): AppSettings {
    const updatedActionsAccess = removeInternalRules(appSettings.actionsAccess);

    return AppSettings.create({
        ...appSettings,
        actionsAccess: updatedActionsAccess,
    });
}
