import React, { useEffect, useMemo } from "react";

import { ConfirmationDialog, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";

import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";

import { Id } from "../../../domain/entities/Ref";
import { User, defaultUser } from "../../../domain/entities/User";

interface ReplicateUserFromTemplateProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
}

export const ReplicateUserFromTemplateFC: React.FC<ReplicateUserFromTemplateProps> = props => {
    const { compositionRoot } = useAppContext();
    const { userToReplicateId, onRequestClose } = props;

    const [userToReplicate, setUserToReplicate] = React.useState<User>(defaultUser);
    const [existingUsernames, setExistingUsernames] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const loading = useLoading();
    const snackbar = useSnackbar();

    const replicateTitle = useMemo(() => {
        console.debug("useMemo replicateTitle");
        return i18n.t("Replicate {{user}}", {
            user: userToReplicate ? `${userToReplicate.name} (${userToReplicate.username})` : "",
        });
    }, [userToReplicate]);

    useEffect(() => {
        const handleUsersError = (message: string) => {
            console.debug("useEffect handleUsersError");
            snackbar.error(i18n.t(message));
            onRequestClose();
        };

        console.debug("useEffect userToReplicate");

        loading.show(true);
        setIsLoading(true);

        compositionRoot.users.get([userToReplicateId]).run(
            ([user]) => {
                if (!user) {
                    handleUsersError(`Unable to load user: ${userToReplicateId}`);
                } else {
                    setUserToReplicate(user);
                }
            },
            error => {
                handleUsersError(`Error loading user (${userToReplicateId}): ${error}`);
            }
        );

        compositionRoot.users.listAllUsernames({}).run(
            usernames => {
                console.debug("usernames", usernames);
                setExistingUsernames(usernames);
            },
            error => {
                console.debug("Error loading usernames", error);
                handleUsersError(`Error loading user (${userToReplicateId}): ${error}`);
            }
        );

        setIsLoading(false);
        loading.reset();

        console.debug("useEffect userToReplicate DONE");
    }, [compositionRoot, loading, onRequestClose, snackbar, userToReplicateId]);

    return (
        <ConfirmationDialog
            isOpen={true}
            title={replicateTitle}
            maxWidth={"md"}
            fullWidth={true}
            saveText={i18n.t("Replicate")}
            onCancel={onRequestClose}
        >
            {!isLoading && (
                <div>
                    ID: {userToReplicate.id}
                    <br />
                    Username: {userToReplicate.username}
                    <br />
                    Usernames count: {existingUsernames.length}
                </div>
            )}
        </ConfirmationDialog>
    );
};

export default ReplicateUserFromTemplateFC;
