import React from "react";
import { TransferOption } from "@dhis2/ui";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { useAppContext } from "../../contexts/app-context";
import { ListOptions } from "../../../domain/repositories/UserRepository";
import { Future } from "../../../domain/entities/Future";
import { HideEntitiesProps } from "./HideEntities";

export function useHideEntities(props: HideEntitiesProps) {
    const { updateHideEntities } = props;

    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const [isLoading, setLoading] = React.useState(true);
    const [users, setUsers] = React.useState<NamedRef[]>([]);
    const [userRoles, setUserRoles] = React.useState<NamedRef[]>([]);
    const [userGroups, setUserGroups] = React.useState<NamedRef[]>([]);

    const transferOptions = React.useMemo(
        () => ({
            users: buildTransferOptions(users),
            userRoles: buildTransferOptions(userRoles),
            userGroups: buildTransferOptions(userGroups),
        }),
        [users, userRoles, userGroups]
    );

    React.useEffect(() => {
        Future.joinObj({
            users: compositionRoot.users.listAll(userListOptions),
            userRoles: compositionRoot.userRoles.getAll(),
            userGroups: compositionRoot.userGroups.getAll(),
        }).run(({ users, userRoles, userGroups }) => {
            setUsers(users);
            setUserRoles(userRoles);
            setUserGroups(userGroups);
            setLoading(false);
        }, snackbar.error);
    }, [compositionRoot, snackbar]);

    const updateUsers = React.useCallback(
        (params: { selected: Id[] }) => updateHideEntities({ users: params.selected }),
        [updateHideEntities]
    );

    const updateUserRoles = React.useCallback(
        (params: { selected: Id[] }) => updateHideEntities({ userRoles: params.selected }),
        [updateHideEntities]
    );

    const updateUserGroups = React.useCallback(
        (params: { selected: Id[] }) => updateHideEntities({ userGroups: params.selected }),
        [updateHideEntities]
    );

    return { transferOptions, updateUsers, updateUserRoles, updateUserGroups, isLoading };
}

const userListOptions: ListOptions = {
    sorting: { field: "name", order: "asc" },
    onlyUsersOrgUnits: false,
    onlyActiveUsers: false,
    hideUsers: [],
};

function buildTransferOptions(options: NamedRef[]): TransferOption[] {
    return options.map(({ id, name }) => ({ value: id, label: name }));
}
