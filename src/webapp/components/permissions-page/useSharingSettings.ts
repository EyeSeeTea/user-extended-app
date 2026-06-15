import React from "react";
import { MetaObject, SharedObject, ShareUpdate, SharingRule } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { NamedRef } from "../../../domain/entities/Ref";
import { useAppSettingsContext } from "../../contexts/AppSettingsProvider";
import { Permission } from "../../../domain/entities/Permission";

function usePermissionState(initial: Permission) {
    const [permission, setPermission] = React.useState<Permission>(initial);

    const sharedObject: SharedObject = React.useMemo(
        () => ({
            id: "",
            userAccesses: mapSharingRule(permission.users),
            userGroupAccesses: mapSharingRule(permission.userGroups),
        }),
        [permission.userGroups, permission.users]
    );

    const metaObject: MetaObject = React.useMemo(() => ({ object: sharedObject }), [sharedObject]);

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

    return { permission, metaObject, onUpdateSharingOptions };
}

export function useSharingSettings() {
    const { compositionRoot } = useAppContext();
    const { appSettings } = useAppSettingsContext();

    const settings = usePermissionState(appSettings.settingsAccess);
    const importSettings = usePermissionState(appSettings.importSettingsAccess);

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

    return {
        search,
        metaObject: settings.metaObject,
        onUpdateSharingOptions: settings.onUpdateSharingOptions,
        permission: settings.permission,
        importMetaObject: importSettings.metaObject,
        onUpdateImportSharingOptions: importSettings.onUpdateSharingOptions,
        importPermission: importSettings.permission,
    };
}

const mapAccessPermission = (rules: SharingRule[]): NamedRef[] => {
    return rules.map(item => ({ id: item.id, name: item.displayName }));
};

const mapSharingRule = (rules: NamedRef[]): SharingRule[] => {
    return rules.map(item => ({ id: item.id, access: "rw------", displayName: item.name }));
};
