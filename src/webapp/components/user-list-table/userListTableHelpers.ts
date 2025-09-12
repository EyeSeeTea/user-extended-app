import { UserAction } from "../../../domain/entities/UserAction";
import i18n from "../../../utils/i18n";

export function getUserActionLabel(action: UserAction): string {
    switch (action) {
        case UserAction.DETAILS:
            return i18n.t("Details");
        case UserAction.EDIT:
            return i18n.t("Edit");
        case UserAction.COPY_IN_USER:
            return i18n.t("Copy in user");
        case UserAction.ASSIGN_TO_ORG_UNITS_CAPTURE:
            return i18n.t("Assign to data capture organisation units");
        case UserAction.ASSIGN_TO_ORG_UNITS_OUTPUT:
            return i18n.t("Assign to data view organisation units");
        case UserAction.ASSIGN_TO_ORG_UNITS_SEARCH:
            return i18n.t("Assign to search organisation units");
        case UserAction.ASSIGN_ROLES:
            return i18n.t("Assign roles");
        case UserAction.ASSIGN_GROUPS:
            return i18n.t("Assign groups");
        case UserAction.ENABLE:
            return i18n.t("Enable");
        case UserAction.DISABLE:
            return i18n.t("Disable");
        case UserAction.RESET_PASSWORD:
            return i18n.t("Reset password");
        case UserAction.SET_PASSWORD:
            return i18n.t("Set password");
        case UserAction.REMOVE:
            return i18n.t("Remove");
        case UserAction.REPLICATE_USER_FROM_TEMPLATE:
            return i18n.t("Replicate user from template");
        case UserAction.REPLICATE_USER_FROM_TABLE:
            return i18n.t("Replicate user from table");
    }
}
