import { UserProps } from "../../../domain/entities/UserProps";
import { UserRole } from "../../../domain/entities/UserRole";
import { useAppContext } from "../../contexts/app-context";
import React from "react";

export function useUserRoles(props: { excludeUsersOutsideOrgUnits: boolean; currentUser: UserProps }): {
    userRoles: UserRole[];
} {
    const { currentUser, excludeUsersOutsideOrgUnits } = props;
    const { compositionRoot } = useAppContext();
    const [userRoles, setUserRoles] = React.useState<UserRole[]>([]);

    React.useEffect(() => {
        return compositionRoot.userRoles
            .get({ excludeUsersOutsideOrgUnits, user: currentUser })
            .run(setUserRoles, console.error);
    }, [compositionRoot.userRoles, currentUser, excludeUsersOutsideOrgUnits]);

    return { userRoles };
}
