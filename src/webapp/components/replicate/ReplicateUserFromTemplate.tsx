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
        console.debug("useEffect userToReplicate");

        loading.show(true);
        setIsLoading(true);

        compositionRoot.users.get([userToReplicateId]).run(
            ([user]) => {
                if (!user) {
                    snackbar.error(i18n.t(`Unable to load user: ${userToReplicateId}`));
                    onRequestClose();
                } else {
                    setUserToReplicate(user);
                }
            },
            error => {
                snackbar.error(i18n.t(`Error loading user (${userToReplicateId}): ${error}`));
                onRequestClose();
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
                </div>
            )}
        </ConfirmationDialog>
    );
};

export default ReplicateUserFromTemplateFC;
