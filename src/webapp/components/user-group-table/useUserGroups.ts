import { UserGroup } from "../../../domain/entities/UserGroup";
import { UserProps } from "../../../domain/entities/UserProps";
import { useAppContext } from "../../contexts/app-context";
import React from "react";

export function useUserGroups(props: { excludeUsersOutsideOrgUnits: boolean; currentUser: UserProps }): {
    userGroups: UserGroup[];
} {
    const { currentUser, excludeUsersOutsideOrgUnits } = props;
    const { compositionRoot } = useAppContext();
    const [userGroups, setUserGroups] = React.useState<UserGroup[]>([]);

    React.useEffect(() => {
        return compositionRoot.userGroups
            .get({ excludeUsersOutsideOrgUnits, user: currentUser })
            .run(setUserGroups, console.error);
    }, [compositionRoot.userGroups, currentUser, excludeUsersOutsideOrgUnits]);

    return { userGroups };
}
