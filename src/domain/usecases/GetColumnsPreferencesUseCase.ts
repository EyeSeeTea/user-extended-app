import _ from "lodash";
import { AppSettings, SettingsUserColumn } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { Column, ColumnAttrs } from "../entities/UserColumn";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserColumnRepository } from "../repositories/UserColumnRepository";
import { User } from "../entities/User";
import { isSuperAdmin, UserProps } from "../entities/UserProps";
import { Maybe } from "../../types/utils";

export class GetColumnsPreferencesUseCase {
    constructor(
        private userColumnRepository: UserColumnRepository,
        private appSettingsRepository: AppSettingsRepository
    ) {}

    execute(user: UserProps): FutureData<Column[]> {
        return this.appSettingsRepository.get().flatMap(appSettings => {
            return this.getColumnsFromSettings(appSettings, user);
        });
    }

    private getColumnsFromSettings(appSettings: AppSettings, user: UserProps): FutureData<Column[]> {
        const columnsConfig = appSettings.columns;

        return this.userColumnRepository.get().map(userColumnsPreferences => {
            const preferencesMap = _.keyBy(userColumnsPreferences, col => col.fieldName);
            const isSuperAdminUser = isSuperAdmin(user);

            const columns = _(columnsConfig)
                .map(columnConfig => {
                    const existingColumn = preferencesMap[columnConfig.field];

                    return this.processColumnByValue(columnConfig, existingColumn, isSuperAdminUser);
                })
                .compact()
                .orderBy(col => (col.position === -1 ? Infinity : -col.position), "desc")
                .value();

            return columns;
        });
    }

    private processColumnByValue(
        columnConfig: SettingsUserColumn,
        existingColumn: Maybe<Column>,
        isSuperAdmin: boolean
    ): Maybe<Column> {
        switch (columnConfig.value) {
            case "disabled":
                // Excluded from the result, except for super admins: they get it as an optional column
                return isSuperAdmin
                    ? existingColumn ?? this.buildColumn(columnConfig.field, "unselected", -1)
                    : undefined;

            case "optional":
                // If exists in preferences, respect its state; otherwise add as unselected
                return existingColumn ?? this.buildColumn(columnConfig.field, "unselected", -1);

            case "visible":
                // If exists in preferences, respect its state; otherwise add as selected
                return existingColumn ?? this.buildColumn(columnConfig.field, "selected", -1);

            case "mandatory": {
                const mandatoryState = isSuperAdmin ? existingColumn?.state ?? "selected" : "selected-disabled";
                // Always add as selected-disabled regardless of preferences
                return this.buildColumn(columnConfig.field, mandatoryState, existingColumn?.position ?? -1);
            }

            default:
                return undefined;
        }
    }

    private buildColumn(fieldName: keyof User, state: ColumnAttrs["state"], position: number): Column {
        return Column.build({ fieldName, state, position }).getOrThrow();
    }
}

/*
Column configuration rules:

1. "disabled": Excluded from the result, regardless of userColumnsPreferences

2. "optional":
   - If exists in userColumnsPreferences: preserve its state
   - If NOT exists: add as "unselected"

3. "visible":
   - If exists in userColumnsPreferences: preserve its state
   - If NOT exists: add as "selected"

4. "mandatory": Always added as "selected-disabled", ignoring userColumnsPreferences

Super admins are not subject to the restrictive rules: "disabled" columns are added as if they
were "optional", and "mandatory" ones keep the state stored in userColumnsPreferences instead of being locked.

Settings example:
[
 "id" -> mandatory
 "email" -> visible
 "groups" -> visible
 "roles" -> mandatory
 "apiUrl" -> disabled
 "firstName" -> optional
]

UserColumnsPreferences:
[
 "email" -> selected
 "apiUrl" -> selected
 "firstName" -> unselected
]

Result:
[
 "id" -> selected-disabled (mandatory, always this state)
 "email" -> selected (visible, preserved from preferences)
 "groups" -> selected (visible, not in preferences so default to selected)
 "roles" -> selected-disabled (mandatory, always this state)
 "apiUrl" -> EXCLUDED (disabled)
 "firstName" -> unselected (optional, preserved from preferences)
]

Result for a super admin:
[
 "id" -> selected (mandatory, not in preferences so default to selected)
 "email" -> selected (visible, preserved from preferences)
 "groups" -> selected (visible, not in preferences so default to selected)
 "roles" -> selected (mandatory, not in preferences so default to selected)
 "apiUrl" -> selected (disabled, preserved from preferences)
 "firstName" -> unselected (optional, preserved from preferences)
]
 */
