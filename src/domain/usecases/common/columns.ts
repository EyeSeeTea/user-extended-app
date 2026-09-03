import _ from "lodash";
import { ColumnSettingValue } from "../../entities/AppSettings";
import { isSuperAdmin, UserProps } from "../../entities/UserProps";
import { Maybe } from "../../../types/utils";

export type ColumnState = "selected" | "unselected" | "selected-disabled";

type ColumnLike<Field extends string> = {
    fieldName: Field;
    state: ColumnState;
    position: number;
};

type ColumnConfig<Field extends string> = { field: Field; value: ColumnSettingValue };

type BuildColumn<Field extends string, Column> = (fieldName: Field, state: ColumnState, position: number) => Column;

type ResolveColumnsOptions<Field extends string, Column extends ColumnLike<Field>> = {
    columnsConfig: ReadonlyArray<ColumnConfig<Field>>;
    preferences: ReadonlyArray<Column>;
    user: UserProps;
    buildColumn: BuildColumn<Field, Column>;
};

/**
 * Combines the columns configured in the app settings with the columns preferences stored by the
 * user, applying the rules documented at the bottom of this file.
 */
export function resolveColumns<Field extends string, Column extends ColumnLike<Field>>(
    options: ResolveColumnsOptions<Field, Column>
): Column[] {
    const { columnsConfig, preferences, user, buildColumn } = options;
    const preferencesMap = _.keyBy(preferences, column => column.fieldName);
    const isSuperAdminUser = isSuperAdmin(user);

    return _(columnsConfig)
        .map((columnConfig, index) =>
            processColumnByValue({
                columnConfig: columnConfig,
                existingColumn: preferencesMap[columnConfig.field],
                isSuperAdmin: isSuperAdminUser,
                buildColumn: buildColumn,
                defaultPosition: index,
            })
        )
        .compact()
        .orderBy(column => column.position, "asc")
        .value();
}

function processColumnByValue<Field extends string, Column extends ColumnLike<Field>>(options: {
    columnConfig: ColumnConfig<Field>;
    existingColumn: Maybe<Column>;
    isSuperAdmin: boolean;
    buildColumn: BuildColumn<Field, Column>;
    // Position in the settings, used for columns the user has no preference for yet
    defaultPosition: number;
}): Maybe<Column> {
    const { columnConfig, existingColumn, isSuperAdmin, buildColumn, defaultPosition } = options;

    switch (columnConfig.value) {
        case "disabled":
            // Excluded from the result, except for super admins: they get it as an optional column
            return isSuperAdmin
                ? existingColumn ?? buildColumn(columnConfig.field, "unselected", defaultPosition)
                : undefined;

        case "optional":
            // If exists in preferences, respect its state; otherwise add as unselected
            return existingColumn ?? buildColumn(columnConfig.field, "unselected", defaultPosition);

        case "visible":
            // If exists in preferences, respect its state; otherwise add as selected
            return existingColumn ?? buildColumn(columnConfig.field, "selected", defaultPosition);

        case "mandatory": {
            const mandatoryState = isSuperAdmin ? existingColumn?.state ?? "selected" : "selected-disabled";
            // Always add as selected-disabled regardless of preferences
            return buildColumn(columnConfig.field, mandatoryState, existingColumn?.position ?? defaultPosition);
        }

        default:
            return undefined;
    }
}

/*
Column configuration rules:

1. "disabled": Excluded from the result, regardless of the columns preferences

2. "optional":
   - If exists in the columns preferences: preserve its state
   - If NOT exists: add as "unselected"

3. "visible":
   - If exists in the columns preferences: preserve its state
   - If NOT exists: add as "selected"

4. "mandatory": Always added as "selected-disabled", ignoring the columns preferences

Order: every column keeps the position stored in the columns preferences. A column the user has no
preference for yet takes its position in the settings, so a column added in a new release shows up
where it was configured instead of jumping to the first place.

Super admins are not subject to the restrictive rules: "disabled" columns are added as if they
were "optional", and "mandatory" ones keep the state stored in the columns preferences instead of being locked.

Settings example:
[
 "id" -> mandatory
 "email" -> visible
 "groups" -> visible
 "roles" -> mandatory
 "apiUrl" -> disabled
 "firstName" -> optional
]

Columns preferences:
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
