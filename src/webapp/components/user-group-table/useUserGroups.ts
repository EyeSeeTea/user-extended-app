import { UserGroup } from "../../../domain/entities/UserGroup";
import { UserProps } from "../../../domain/entities/UserProps";
import { AppSettings } from "../../../domain/entities/AppSettings";
import { useAppContext } from "../../contexts/app-context";
import React from "react";

export function useUserGroups(props: {
    excludeUsersOutsideOrgUnits: boolean;
    currentUser: UserProps;
    appSettings: AppSettings;
}): {
    userGroups: UserGroup[];
} {
    const { currentUser, excludeUsersOutsideOrgUnits, appSettings } = props;
    const { compositionRoot } = useAppContext();
    const [userGroups, setUserGroups] = React.useState<UserGroup[]>([]);

    /* appSettings is not read here, but the use case resolves the description source and the
     * hidden users/groups from it: it must be a dependency to reload when the settings change. */
    React.useEffect(() => {
        return compositionRoot.userGroups
            .get({ excludeUsersOutsideOrgUnits, user: currentUser })
            .run(setUserGroups, console.error);
    }, [compositionRoot.userGroups, currentUser, excludeUsersOutsideOrgUnits, appSettings]);

    return { userGroups };
}
