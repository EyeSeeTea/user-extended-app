import _ from "lodash";
import React from "react";
import { DropdownItem, useSnackbar } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { SharingActionsProps } from "./SharingActions";
import { UserGroup } from "../../../domain/entities/UserGroup";
import { ActionsPermissions } from "../../../domain/entities/AppSettings";
import { getId, Id } from "../../../domain/entities/Ref";
import { isPermissionPublic } from "../../../domain/entities/Permission";
import { UserAction } from "../../../domain/entities/UserAction";
import i18n from "../../../locales";

export function useSharingActions(props: SharingActionsProps) {
    const { actionsPermissions, setActionsPermissions } = props;

    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const [allUserGroups, setUserGroups] = React.useState<UserGroup[]>([]);
    const [selectedValues, setSelectedValues] = React.useState<Record<UserAction, Value[]>>(
        mapSelectedValues(actionsPermissions)
    );

    const setSelectedValuesByAction = React.useCallback(
        (action: UserAction) => (values: Value[]) => {
            setSelectedValues(selectedValues => {
                const isPublicSelected =
                    values.includes("public-access") && !selectedValues[action].includes("public-access");
                const shouldForcePublic = isPublicSelected || _.isEmpty(values);
                const shouldFilterOutPublic = values.length > 1;
                const removedPublic = values.filter(value => value !== "public-access");

                const newValues = shouldForcePublic
                    ? ["public-access"]
                    : shouldFilterOutPublic
                    ? removedPublic
                    : values;

                setActionsPermissions(actionsPermissions => ({
                    ...actionsPermissions,
                    [action]: {
                        publicAccess: shouldForcePublic ? "rw----" : "------",
                        users: [],
                        userGroups: allUserGroups.filter(userGroup => removedPublic.includes(userGroup.id)),
                    },
                }));

                return {
                    ...selectedValues,
                    [action]: newValues,
                };
            });
        },
        [allUserGroups, setActionsPermissions]
    );

    const items = React.useMemo(() => {
        const publicAccessItem = buildPublicAccessItem();

        return [publicAccessItem].concat(
            allUserGroups.map(userGroup => ({
                value: userGroup.id,
                text: userGroup.name,
            }))
        );
    }, [allUserGroups]);

    React.useEffect(() => {
        return compositionRoot.userGroups.getAll().run(setUserGroups, snackbar.error);
    }, [compositionRoot.userGroups, snackbar.error]);

    return {
        items,
        selectedValues,
        setSelectedValues: setSelectedValuesByAction,
    };
}

function buildPublicAccessItem(): DropdownItem {
    return {
        value: "public-access",
        text: i18n.t("Public access (Everyone)"),
    };
}

function mapSelectedValues(actionsPermissions: ActionsPermissions): Record<UserAction, Value[]> {
    return _.mapValues(actionsPermissions, permission => {
        return isPermissionPublic(permission) ? ["public-access"] : permission.userGroups.map(getId);
    });
}

export type Value = Id;
