import _ from "lodash";
import React from "react";
import { MetaObject, SharedObject, ShareUpdate, SharingRule } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { NamedRef } from "../../../domain/entities/Ref";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { Permission } from "../../../domain/entities/Permission";

export function useSharingSettings() {
    const { compositionRoot } = useAppContext();
    const { appSettings } = useAppSettingsContext();

    const [permission, setPermission] = React.useState<Permission>(appSettings.settingsAccess);

    const sharedObject: SharedObject = React.useMemo(
        () => ({
            id: "",
            userAccesses: mapSharingRule(permission.users),
            userGroupAccesses: mapSharingRule(permission.userGroups),
            publicAccess: permission.publicAccess,
        }),
        [permission.publicAccess, permission.userGroups, permission.users]
    );

    const metaObject: MetaObject = React.useMemo(() => ({ object: sharedObject }), [sharedObject]);

    const search = React.useCallback(
        (query: string) => compositionRoot.users.searchUsersAndGroups(query).toPromise(),
        [compositionRoot]
    );

    const onUpdateSharingOptions = React.useCallback(
        /* Marked async only because it is typed that way on the Sharing props */
        async ({ userAccesses, userGroupAccesses }: ShareUpdate) => {
            const isLimited = !_.isEmpty(userAccesses) || !_.isEmpty(userGroupAccesses);

            setPermission(permissions => ({
                users: userAccesses ? mapAccessPermission(userAccesses) : permissions.users,
                userGroups: userGroupAccesses ? mapAccessPermission(userGroupAccesses) : permissions.userGroups,
                publicAccess: isLimited ? "--------" : "rw------",
            }));
        },
        [setPermission]
    );

    return { search, metaObject, onUpdateSharingOptions, permission };
}

const mapAccessPermission = (rules: SharingRule[]): NamedRef[] => {
    return rules.map(item => ({ id: item.id, name: item.displayName }));
};

const mapSharingRule = (rules: NamedRef[]): SharingRule[] => {
    return rules.map(item => ({ id: item.id, access: "rw------", displayName: item.name }));
};
