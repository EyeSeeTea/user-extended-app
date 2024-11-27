import React, { useCallback, useEffect, useMemo } from "react";
import i18n from "../../../locales";
import { Id } from "../../../domain/entities/Ref";
import { useAppContext } from "../../contexts/app-context";
import { ImportTable, Columns } from "../import-export/ImportTable";
import { User, defaultUser } from "../../../domain/entities/User";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { generateUid } from "../../../utils/uid";

interface ReplicateUserFromTableProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
}

export const ReplicateUserFromTable: React.FC<ReplicateUserFromTableProps> = props => {
    const { compositionRoot } = useAppContext();
    const { userToReplicateId, onRequestClose } = props;

    const [userToReplicate, setUserToReplicate] = React.useState<User>(defaultUser);
    const [isMounted, setIsMounted] = React.useState(false);

    const loading = useLoading();
    const snackbar = useSnackbar();

    useEffect(() => {
        const handleUsersError = (message: string) => {
            snackbar.error(i18n.t(message));
            onRequestClose();
        };

        compositionRoot.users.get([userToReplicateId]).run(
            ([user]) => {
                if (!user) {
                    handleUsersError(`Unable to load user: ${userToReplicateId}`);
                } else {
                    setUserToReplicate(user);
                    setIsMounted(true);
                }
            },
            error => {
                handleUsersError(`Error loading user (${userToReplicateId}): ${error}`);
            }
        );
    }, [compositionRoot.users, onRequestClose, snackbar, userToReplicateId]);

    const replicateTitle = useMemo(() => {
        console.debug("useMemo replicateTitle");
        return i18n.t("Replicate {{user}}", {
            user: userToReplicate ? `${userToReplicate.name} (${userToReplicate.username})` : "",
        });
    }, [userToReplicate]);

    const columns: Columns[] = [
        "username",
        "password",
        "firstName",
        "surname",
        "email",
        "userRoles",
        "userGroups",
        "dataViewOrganisationUnits",
        "organisationUnits",
    ];

    const replicateUsers = useCallback(
        async ({ users }: { users: User[] }) => {
            loading.show(true, i18n.t("Replicating users"));

            const newUsers: User[] = users.map(tableUser => {
                return {
                    ...userToReplicate,
                    id: generateUid(),
                    username: tableUser.username,
                    password: tableUser.password,
                    firstName: tableUser.firstName,
                    surname: tableUser.surname,
                    email: tableUser.email,
                    userGroups: tableUser.userGroups,
                    userRoles: tableUser.userRoles,
                    dataViewOrganisationUnits: tableUser.dataViewOrganisationUnits,
                    organisationUnits: tableUser.organisationUnits,
                    externalAuth: false,
                    twoFA: false,
                    openId: "",
                    ldapId: "",
                };
            });

            return compositionRoot.users.import({ users: newUsers }).run(
                () => {
                    loading.hide();
                    onRequestClose();
                    snackbar.success(i18n.t("Users replicated successfully"));
                },
                error => {
                    loading.hide();
                    snackbar.error(error);
                }
            );
        },
        [loading, compositionRoot.users, userToReplicate, onRequestClose, snackbar]
    );

    if (!isMounted) {
        return null;
    }

    return (
        <ImportTable
            title={replicateTitle}
            actionText={i18n.t("Replicate")}
            usersFromFile={[]}
            columns={columns}
            onSubmit={replicateUsers}
            onRequestClose={props.onRequestClose}
            templateUser={userToReplicate}
            warnings={[]}
        />
    );
};

export default ReplicateUserFromTable;
