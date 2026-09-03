import { AppSettings } from "../entities/AppSettings";
import { isPermissionEmpty } from "../entities/Permission";
import { Future, FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../../domain/repositories/AppSettingsRepository";

export class SaveAppSettingsUseCase {
    constructor(private appSettingsRepository: AppSettingsRepository) {}

    execute(options: SaveAppSettingsOptions): FutureData<AppSettings> {
        return this.validateActionsAccess(options.appSettings).flatMap(() => {
            const settingsWithStatus = options.appSettings.updateStatus("active");
            return this.appSettingsRepository.save(settingsWithStatus);
        });
    }

    // Actions must include a selectable rule when users or user groups are assigned
    private validateActionsAccess(appSettings: AppSettings): FutureData<void> {
        const hasEmptyRules = Object.entries(appSettings.actionsAccess).some(([_action, permission]) => {
            const hasWhitelist = !isPermissionEmpty(permission);
            return hasWhitelist && permission.getSelectableRules().length === 0;
        });

        return hasEmptyRules ? Future.error("EMPTY_RULES_IN_ACTION_PERMISSION") : Future.success(undefined);
    }
}

export type SaveAppSettingsOptions = { appSettings: AppSettings };
