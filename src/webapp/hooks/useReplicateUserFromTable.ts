import React, { useCallback, useEffect, useMemo } from "react";
import i18n from "../../utils/i18n";
import { Id } from "../../domain/entities/Ref";
import { useAppContext } from "../contexts/app-context";
import { UserProps, defaultUserProps } from "../../domain/entities/UserProps";
import { User } from "../../domain/entities/User";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { generateUid } from "../../utils/uid";

export function useReplicateUserFromTable(userToReplicateId: Id, onRequestClose: () => void) {
    const { compositionRoot } = useAppContext();
    const [userToReplicate, setUserToReplicate] = React.useState<UserProps>(defaultUserProps);
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

    const replicateUsers = useCallback(
        async ({ users }: { users: UserProps[] }) => {
            loading.show(true, i18n.t("Replicating users"));

            try {
                const newUsers: User[] = users.map(tableUser => {
                    return User.createNewUser({
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
                        twoFactorEnabled: false,
                        openId: "",
                        ldapId: "",
                    });
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
            } catch (error) {
                loading.hide();
                snackbar.error((error as Error).message);
            }
        },
        [loading, compositionRoot.users, userToReplicate, onRequestClose, snackbar]
    );

    return {
        replicateTitle,
        replicateUsers,
        userToReplicate,
        isMounted,
    };
}
