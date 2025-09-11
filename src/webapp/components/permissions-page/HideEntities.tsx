import React from "react";
import { Transfer, TransferProps } from "@dhis2/ui";
import { Box, Typography, useTheme } from "@material-ui/core";
import { Id } from "../../../domain/entities/Ref";
import { useHideEntities } from "./useHideEntities";
import i18n from "../../../utils/i18n";

export type HideEntitiesProps = {
    selectedUsers: Id[];
    selectedUserGroups: Id[];
    selectedUserRoles: Id[];
    updateHideEntities: (hideOptions: Partial<{ users: Id[]; userGroups: Id[]; userRoles: Id[] }>) => void;
};

export const HideEntities: React.FC<HideEntitiesProps> = React.memo((props: HideEntitiesProps) => {
    const { selectedUserGroups, selectedUserRoles, selectedUsers } = props;
    const { transferOptions, updateUsers, updateUserRoles, updateUserGroups, isLoading } = useHideEntities(props);

    const theme = useTheme();

    return (
        <Box display="flex" flexDirection="column" gridRowGap={theme.spacing(2)}>
            <Box>
                <Typography variant="h6" gutterBottom>
                    {i18n.t("Users")}
                </Typography>
                <Transfer
                    {...commonProps}
                    options={transferOptions.users}
                    selected={selectedUsers}
                    onChange={updateUsers}
                    filterPlaceholder={i18n.t("Search users")}
                    filterPlaceholderPicked={i18n.t("Search users")}
                    loading={isLoading}
                />
            </Box>
            <Box>
                <Typography variant="h6" gutterBottom>
                    {i18n.t("User Roles")}
                </Typography>
                <Transfer
                    {...commonProps}
                    options={transferOptions.userRoles}
                    selected={selectedUserRoles}
                    onChange={updateUserRoles}
                    filterPlaceholder={i18n.t("Search user roles")}
                    filterPlaceholderPicked={i18n.t("Search user roles")}
                    loading={isLoading}
                />
            </Box>
            <Box>
                <Typography variant="h6" gutterBottom>
                    {i18n.t("User Groups")}
                </Typography>
                <Transfer
                    {...commonProps}
                    options={transferOptions.userGroups}
                    selected={selectedUserGroups}
                    onChange={updateUserGroups}
                    filterPlaceholder={i18n.t("Search user groups")}
                    filterPlaceholderPicked={i18n.t("Search user groups")}
                    loading={isLoading}
                />
            </Box>
        </Box>
    );
});

const commonProps: Partial<TransferProps> = {
    filterable: true,
    filterablePicked: true,
    selectedWidth: "100%",
    optionsWidth: "100%",
    height: "300px",
};
