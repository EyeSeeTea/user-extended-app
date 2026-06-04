import { FilterBase } from "@eyeseetea/d2-api/api/common";
import { UserListFilters } from "../../domain/repositories/UserRepository";

export type D2ApiFilters = FilterBase;

export function translateUserFilters(
    filters: UserListFilters | undefined,
    onlyActiveUsers: boolean,
    is242Plus: boolean
): D2ApiFilters {
    const withVersionPrefix = (field: string) => (is242Plus ? field : `userCredentials.${field}`);
    const equalityFilter = (v: boolean) => ({ eq: String(v) });
    const arrayFilter = (ids: string[]) => ({ in: ids });

    const disabledKey = withVersionPrefix("disabled");
    const disabledEntry: D2ApiFilters = onlyActiveUsers
        ? { [disabledKey]: equalityFilter(false) }
        : filters?.disabled != null
        ? { [disabledKey]: equalityFilter(filters.disabled) }
        : {};

    if (!filters) return disabledEntry;

    return {
        ...disabledEntry,
        ...(!is242Plus && filters.twoFA != null ? { "userCredentials.twoFA": equalityFilter(filters.twoFA) } : {}),
        ...(filters.externalAuth != null ? { [withVersionPrefix("externalAuth")]: equalityFilter(filters.externalAuth) } : {}),
        ...(filters.userRoles?.length ? { [withVersionPrefix("userRoles.id")]: arrayFilter(filters.userRoles) } : {}),
        ...(filters.userGroups?.length ? { "userGroups.id": arrayFilter(filters.userGroups) } : {}),
        ...(filters.organisationUnits?.length ? { "organisationUnits.id": arrayFilter(filters.organisationUnits) } : {}),
        ...(filters.dataViewOrganisationUnits?.length ? { "dataViewOrganisationUnits.id": arrayFilter(filters.dataViewOrganisationUnits) } : {}),
        ...(filters.teiSearchOrganisationUnits?.length ? { "teiSearchOrganisationUnits.id": arrayFilter(filters.teiSearchOrganisationUnits) } : {}),
        ...(filters.username?.length ? { [withVersionPrefix("username")]: arrayFilter(filters.username) } : {}),
        ...(filters.id?.length ? { id: arrayFilter(filters.id) } : {}),
    };
}
