import React, { useEffect, useCallback } from "react";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { FormState } from "final-form";
import _ from "lodash";

import i18n from "../../locales";
import { useAppContext } from "../contexts/app-context";
import { Id } from "../../domain/entities/Ref";
import { defaultUserProps } from "../../domain/entities/UserProps";
import { User } from "../../domain/entities/User";
import { Future } from "../../domain/entities/Future";
import { ReplicateTemplate, ReplicateTemplateProps } from "../../domain/entities/ReplicateTemplate";

export interface UseReplicateUserFromTemplateReturn {
    userToReplicate: User;
    existingUsernames: string[];
    replicateTitle: string;
    hasValidationErrors: boolean;
    isMounted: boolean;
    randomPasswordBase: string;
    initialValues: ReplicateTemplateProps;
    validateTemplate: (values: ReplicateTemplateProps) => Record<string, string>;
    replicateUsers: (values: ReplicateTemplateProps) => void;
    handleFormStateChange: (state: FormState<ReplicateTemplateProps>) => void;
}

export const useReplicateUserFromTemplate = (
    userToReplicateId: Id,
    onRequestClose: () => void
): UseReplicateUserFromTemplateReturn => {
    const { compositionRoot } = useAppContext();

    const [userToReplicate, setUserToReplicate] = React.useState<User>(new User(defaultUserProps));
    const [existingUsernames, setExistingUsernames] = React.useState<string[]>([]);
    const [replicateTitle, setReplicateTitle] = React.useState<string>(i18n.t("Replicate User"));
    const [hasValidationErrors, setValidationError] = React.useState<boolean>(false);
    const [isUserLoaded, setIsUserLoaded] = React.useState(true);
    const [isMounted, setIsMounted] = React.useState(false);

    const loading = useLoading();
    const snackbar = useSnackbar();

    const randomPasswordBase = React.useMemo(() => {
        return User.generateRandomPassword();
    }, []);

    const initialValues = React.useMemo(() => {
        return {
            replicateCount: "1",
            usernameTemplate: `${userToReplicate.username}_$index`,
            passwordTemplate: `${randomPasswordBase}_$index`,
        };
    }, [userToReplicate, randomPasswordBase]);

    useEffect(() => {
        const handleUsersError = (message: string) => {
            snackbar.error(i18n.t(message));
            onRequestClose();
        };

        loading.show(true);
        setIsUserLoaded(false);

        const userFuture = compositionRoot.users.get([userToReplicateId]);
        const usernamesFuture = compositionRoot.users.listAll({});

        Future.joinObj({
            user: userFuture,
            allUsers: usernamesFuture,
        }).run(
            ({ user: [user], allUsers }) => {
                if (!user) {
                    handleUsersError(`Unable to load user: ${userToReplicateId}`);
                } else {
                    setUserToReplicate(new User(user));
                    const usernames = allUsers.map(u => u.username);
                    setExistingUsernames(usernames);
                    setIsUserLoaded(true);
                }
            },
            error => {
                handleUsersError(`Error loading users data: ${error}`);
            }
        );
    }, [compositionRoot, loading, onRequestClose, snackbar, userToReplicateId]);

    useEffect(() => {
        if (isUserLoaded && userToReplicate.username) {
            setReplicateTitle(
                i18n.t("Replicate {{user}}", {
                    user: `${userToReplicate.name} (${userToReplicate.username})`,
                })
            );
            setIsMounted(true);
            loading.reset();
        }
    }, [isUserLoaded, loading, userToReplicate]);

    const validateTemplate = useCallback(
        (values: ReplicateTemplateProps) => {
            return ReplicateTemplate.validateReplicateTemplate(values, existingUsernames);
        },
        [existingUsernames]
    );

    const replicateUsers = useCallback(
        async ({
            replicateCount,
            usernameTemplate,
            passwordTemplate,
        }: {
            replicateCount: string;
            usernameTemplate: string;
            passwordTemplate: string;
        }) => {
            loading.show(true, i18n.t("Replicating users"));

            return compositionRoot.users
                .replicateFromTemplate(userToReplicate, parseInt(replicateCount), usernameTemplate, passwordTemplate)
                .run(
                    () => {
                        loading.hide();
                        onRequestClose();
                        snackbar.success(
                            i18n.t("User {{user}} replicated successfully {{n}} times", {
                                user: userToReplicate.username,
                                n: replicateCount,
                            })
                        );
                    },
                    error => {
                        loading.hide();
                        snackbar.error(
                            i18n.t("Error replicating user {{user}}: {{message}}", {
                                user: userToReplicate.username,
                                message: error,
                                nsSeparator: false,
                            })
                        );
                    }
                );
        },
        [compositionRoot.users, loading, snackbar, onRequestClose, userToReplicate]
    );

    const handleFormStateChange = useCallback((state: FormState<ReplicateTemplateProps>) => {
        requestAnimationFrame(() => {
            setValidationError(!_.isEmpty(state.errors));
        });
    }, []);

    return {
        userToReplicate,
        existingUsernames,
        replicateTitle,
        hasValidationErrors,
        isMounted,
        randomPasswordBase,
        initialValues,
        validateTemplate,
        replicateUsers,
        handleFormStateChange,
    };
};
