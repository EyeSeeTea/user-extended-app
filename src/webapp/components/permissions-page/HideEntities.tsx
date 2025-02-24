import { Transfer, TransferOption } from "@dhis2/ui";
import { Box, Typography, useTheme } from "@material-ui/core";
import React from "react";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { useAppContext } from "../../contexts/app-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../locales";

interface HideEntitiesProps {
    selectedUsers: Id[];
    selectedUserGroups: Id[];
    selectedUserRoles: Id[];
    onUpdateHideEntities: (users: string[], userGroups: string[], userRoles: string[]) => void;
}

export const HideEntities: React.FC<HideEntitiesProps> = React.memo((props: HideEntitiesProps) => {
    const { selectedUserGroups, selectedUserRoles, selectedUsers, onUpdateHideEntities } = props;

    const { compositionRoot } = useAppContext();
    const theme = useTheme();
    const snackbar = useSnackbar();

    const [users, setUsers] = React.useState<NamedRef[]>([]);
    const [userRoles, setUserRoles] = React.useState<NamedRef[]>([]);
    const [userGroups, setUserGroups] = React.useState<NamedRef[]>([]);

    React.useEffect(() => {
        // compositionRoot.users.get.then(users=>setUsers(users));
        compositionRoot.userRoles.getAll().run(setUserRoles, snackbar.error);
        compositionRoot.userGroups.getAll().run(setUserGroups, snackbar.error);
    }, [compositionRoot, snackbar]);

    return (
        <Box display="flex" flexDirection="column" gridRowGap={theme.spacing(2)}>
            <Box>
                <Typography variant="h6" gutterBottom>
                    {i18n.t("Users")}
                </Typography>
                <Transfer
                    options={buildTransferOptions(users)}
                    selected={selectedUsers}
                    onChange={({ selected }) => {
                        console.log(selected);
                    }}
                    filterable={true}
                    filterablePicked={true}
                    filterPlaceholder={i18n.t("Search")}
                    filterPlaceholderPicked={i18n.t("Search")}
                    selectedWidth="100%"
                    optionsWidth="100%"
                    height="400px"
                />
            </Box>
            <Box>
                <Typography variant="h6" gutterBottom>
                    {i18n.t("User Roles")}
                </Typography>
                <Transfer
                    options={buildTransferOptions(userRoles)}
                    selected={selectedUserRoles}
                    onChange={({ selected }) => {
                        console.log(selected);
                    }}
                    filterable={true}
                    filterablePicked={true}
                    filterPlaceholder={i18n.t("Search")}
                    filterPlaceholderPicked={i18n.t("Search")}
                    selectedWidth="100%"
                    optionsWidth="100%"
                    height="400px"
                />
            </Box>
            <Box>
                <Typography variant="h6" gutterBottom>
                    {i18n.t("User Groups")}
                </Typography>
                <Transfer
                    options={buildTransferOptions(userGroups)}
                    selected={selectedUserGroups}
                    onChange={({ selected }) => {
                        console.log(selected);
                    }}
                    filterable={true}
                    filterablePicked={true}
                    filterPlaceholder={i18n.t("Search")}
                    filterPlaceholderPicked={i18n.t("Search")}
                    selectedWidth="100%"
                    optionsWidth="100%"
                    height="400px"
                />
            </Box>
        </Box>
    );
});

function buildTransferOptions(options: NamedRef[]): TransferOption[] {
    return options.map(({ id, name }) => ({ value: id, label: name }));
}
