import _ from "lodash";
import { ActionsPermissions, AppSettings } from "../../../domain/entities/AppSettings";
import { Permission, PublicPermission } from "../../../domain/entities/Permission";
import { getKeys, Maybe } from "../../../types/utils";

export function mergeAppSettings(appSettings: Maybe<Partial<AppSettings>>): AppSettings {
    const emptySettings = AppSettings.emptySettings();
    if (!appSettings) return emptySettings;

    const settingsAccess = appSettings.settingsAccess
        ? new Permission(appSettings.settingsAccess)
        : emptySettings.settingsAccess;

    const actionsAccess = appSettings.actionsAccess
        ? _.mapValues(appSettings.actionsAccess, p => new PublicPermission(p))
        : emptySettings.actionsAccess;

    return AppSettings.create({
        ...emptySettings,
        ...appSettings,
        settingsAccess: settingsAccess,
        actionsAccess: migrateNewerActions(actionsAccess),
    });
}

/* New actions may be added in the future, so we need to ensure that
 the actionsAccess object contains all actions, even if they are not defined in the appSettings
 that could be already saved.
 */
function migrateNewerActions(actionsAccess: ActionsPermissions): ActionsPermissions {
    const newActionsAccess = AppSettings.emptySettings().actionsAccess;

    const newerActions = getKeys(newActionsAccess);
    const currentActions = getKeys(actionsAccess);

    const actionsToMigrate = newerActions.filter(action => !currentActions.includes(action));
    if (actionsToMigrate.length === 0) return actionsAccess;

    const newerPublic = _.pick(newActionsAccess, actionsToMigrate);

    return {
        ...actionsAccess,
        ...newerPublic,
    };
}
