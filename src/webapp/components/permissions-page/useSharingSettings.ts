import React from "react";
import { MetaObject, SharedObject, ShareUpdate, SharingRule } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { NamedRef } from "../../../domain/entities/Ref";
import { Permission } from "../../../domain/entities/Permission";

export function useSharingSettings(settingsAccess: Permission) {
    const { compositionRoot } = useAppContext();

    const [permission, setPermission] = React.useState<Permission>(settingsAccess);

    const sharedObject: SharedObject = React.useMemo(
        () => ({
            id: "",
            userAccesses: mapSharingRule(permission.users),
            userGroupAccesses: mapSharingRule(permission.userGroups),
        }),
        [permission.userGroups, permission.users]
    );

    const metaObject: MetaObject = React.useMemo(() => ({ object: sharedObject }), [sharedObject]);

    const search = React.useCallback(
        (query: string) =>
            compositionRoot.users
                .searchUsersAndGroups(query)
                .map(userSearch => ({
                    users: userSearch.users.map(user => ({ id: user.id, displayName: user.name })),
                    userGroups: userSearch.userGroups.map(userGroup => ({
                        id: userGroup.id,
                        displayName: userGroup.name,
                    })),
                }))
                .toPromise(),
        [compositionRoot]
    );

    const onUpdateSharingOptions = React.useCallback(
        /* Marked async only because it is typed that way on the Sharing props */
        async ({ userAccesses, userGroupAccesses }: ShareUpdate) => {
            setPermission(
                permissions =>
                    new Permission({
                        users: userAccesses ? mapAccessPermission(userAccesses) : permissions.users,
                        userGroups: userGroupAccesses ? mapAccessPermission(userGroupAccesses) : permissions.userGroups,
                    })
            );
        },
        [setPermission]
    );

    return {
        metaObject: metaObject,
        permission: permission,
        onUpdateSharingOptions: onUpdateSharingOptions,
        search: search,
    };
}

const mapAccessPermission = (rules: SharingRule[]): NamedRef[] => {
    return rules.map(item => ({ id: item.id, name: item.displayName }));
};

const mapSharingRule = (rules: NamedRef[]): SharingRule[] => {
    return rules.map(item => ({ id: item.id, access: "rw------", displayName: item.name }));
};
