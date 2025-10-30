import React from "react";
import { ConfirmationDialog, MultiSelector } from "@eyeseetea/d2-ui-components";
import { DropdownForm } from "@eyeseetea/d2-ui-components/dropdown/GenericDropdown";
import { Select, MenuItem, Switch, FormControlLabel, IconButton } from "@material-ui/core";
import FilterIcon from "@material-ui/icons/FilterList";

import { Id } from "../../../domain/entities/Ref";
import { UserSimple } from "../../../domain/entities/UserSimple";
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";
import styled from "styled-components";

export type UsersFiltersProps = {
    onFilterChange: (filters: { users: FilteredUser[]; excludeOutsideOrgUnit: boolean }) => void;
    showFilterModal?: boolean;
    showUsersModal?: boolean;
};

export const UsersFilters: React.FC<UsersFiltersProps> = React.memo(props => {
    const { onFilterChange, showUsersModal, showFilterModal } = props;
    const [showSharing, setShowSharing] = React.useState(false);
    const [openFilterDialog, setOpenFilterDialog] = React.useState(false);
    const [excludeOrgUnit, setExcludeOrgUnit] = React.useState(true);
    const [ids, selectedIds] = React.useState<Id[]>([]);
    const { users } = useGetUsersSimple();

    const openSharingDialog = React.useCallback(() => {
        if (users && users?.length > 0) {
            setShowSharing(true);
        }
    }, [users]);

    const usersItem = React.useMemo(() => {
        if (!users) return [];
        return users.map(user => {
            return { text: user.fullDescription, value: user.id };
        });
    }, [users]);

    const currentUsers = React.useMemo(() => {
        return ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
    }, [ids, usersItem]);

    const updateSelectedUsers = React.useCallback(() => {
        setShowSharing(false);
        const currentUsers = ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
        onFilterChange({ users: currentUsers, excludeOutsideOrgUnit: excludeOrgUnit });
    }, [onFilterChange, usersItem, ids, excludeOrgUnit]);

    const updateExcludeOrgUnit = React.useCallback(() => {
        onFilterChange({ users: currentUsers, excludeOutsideOrgUnit: excludeOrgUnit });
        setOpenFilterDialog(false);
    }, [onFilterChange, currentUsers, excludeOrgUnit]);

    return (
        <Container>
            <div>
                {showUsersModal && (
                    <DropdownForm label={!users ? i18n.t("Loading users...") : i18n.t("Filter owners")}>
                        <Select value="value" onOpen={openSharingDialog} open={false}>
                            <MenuItem value="value">{currentUsers.map(user => user.text).join(", ")}</MenuItem>
                        </Select>
                    </DropdownForm>
                )}

                {showSharing && (
                    <ConfirmationDialog
                        cancelText={i18n.t("Clear")}
                        saveText={i18n.t("Save")}
                        onSave={updateSelectedUsers}
                        open={showSharing}
                        onCancel={() => {
                            setShowSharing(false);
                            selectedIds([]);
                            onFilterChange({ users: [], excludeOutsideOrgUnit: excludeOrgUnit });
                        }}
                        maxWidth="lg"
                        title={i18n.t("Select users")}
                    >
                        <MultiSelector
                            d2={{}}
                            onChange={selectedIds}
                            options={usersItem}
                            selected={ids}
                            searchFilterLabel={i18n.t("Search")}
                        />
                    </ConfirmationDialog>
                )}
            </div>

            {showFilterModal && (
                <>
                    <IconButton aria-label={i18n.t("Filters")} onClick={() => setOpenFilterDialog(true)}>
                        <FilterIcon />
                    </IconButton>
                    <ConfirmationDialog
                        cancelText={i18n.t("Close")}
                        saveText={i18n.t("Save")}
                        onSave={updateExcludeOrgUnit}
                        open={openFilterDialog}
                        onCancel={() => {
                            setOpenFilterDialog(false);
                            onFilterChange({ users: currentUsers, excludeOutsideOrgUnit: excludeOrgUnit });
                        }}
                        maxWidth="lg"
                        title={i18n.t("Filters")}
                    >
                        <div>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={excludeOrgUnit}
                                        onChange={e => setExcludeOrgUnit(e.target.checked)}
                                    />
                                }
                                label={i18n.t("Show only users assigned to my organization unit and below")}
                            />
                        </div>
                    </ConfirmationDialog>
                </>
            )}
        </Container>
    );
});

export function useGetUsersSimple() {
    const { compositionRoot, currentUser } = useAppContext();
    const [users, setUsers] = React.useState<UserSimple[]>([]);

    React.useEffect(
        () =>
            compositionRoot.users.getInOrgUnits(currentUser).run(
                users => {
                    setUsers(users);
                },
                error => console.error(error)
            ),
        [compositionRoot.users, currentUser]
    );

    return { users };
}

export type FilteredUser = { value: Id; text: string };

export const Container = styled.div`
    display: flex;
    align-items: center;
`;
