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
import { DashboardOwner } from "../../../domain/entities/DashboardOwner";

export type UsersFiltersProps = {
    onFilterChange: (filters: {
        users: FilteredUser[];
        excludeOutsideOrgUnit: boolean;
        owners: FilteredUser[];
    }) => void;
    showUserFilter?: boolean;
    showOwnerFilter?: boolean;
    showOrgUnitFilter?: boolean;
    filterUserLabel?: string;
};

export const UsersFilters: React.FC<UsersFiltersProps> = React.memo(props => {
    const { onFilterChange, showUserFilter, showOwnerFilter, showOrgUnitFilter, filterUserLabel = "" } = props;
    const [showUserFilterModal, setShowUserFilterModal] = React.useState(false);
    const [showOwnerFilterModal, setShowOwnerFilterModal] = React.useState(false);
    const [openFilterDialog, setOpenFilterDialog] = React.useState(false);
    const [excludeOrgUnit, setExcludeOrgUnit] = React.useState(true);
    const [ids, selectedIds] = React.useState<Id[]>([]);
    const [ownerIds, selectedOwnerIds] = React.useState<Id[]>([]);
    const { users } = useGetUsersSimple({ enabled: showUserFilter ?? false });
    const { owners } = useGetDashboardOwners({ enabled: showOwnerFilter ?? false });

    const openUserFilterModal = React.useCallback(() => {
        if (users && users?.length > 0) {
            setShowUserFilterModal(true);
        }
    }, [users]);

    const openOwnerFilterModal = React.useCallback(() => {
        if (owners && owners?.length > 0) {
            setShowOwnerFilterModal(true);
        }
    }, [owners]);

    const usersItem = React.useMemo(() => {
        if (!users) return [];
        return users.map(user => {
            return { text: user.fullDescription, value: user.id };
        });
    }, [users]);

    const ownersItem = React.useMemo(() => {
        return owners.map(owner => {
            return { text: owner.name, value: owner.id };
        });
    }, [owners]);

    const currentUsers = React.useMemo(() => {
        return ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
    }, [ids, usersItem]);

    const currentOwners = React.useMemo(() => {
        return ownerIds.length > 0 ? ownersItem.filter(owner => ownerIds.includes(owner.value)) : [];
    }, [ownerIds, ownersItem]);

    const updateSelectedUsers = React.useCallback(() => {
        setShowUserFilterModal(false);
        const currentUsers = ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
        onFilterChange({ users: currentUsers, excludeOutsideOrgUnit: excludeOrgUnit, owners: currentOwners });
    }, [onFilterChange, usersItem, ids, excludeOrgUnit, currentOwners]);

    const updateExcludeOrgUnit = React.useCallback(() => {
        onFilterChange({ users: currentUsers, excludeOutsideOrgUnit: excludeOrgUnit, owners: currentOwners });
        setOpenFilterDialog(false);
    }, [onFilterChange, currentUsers, excludeOrgUnit, currentOwners]);

    const updateSelectedOwners = React.useCallback(() => {
        setShowOwnerFilterModal(false);
        const currentOwners = ownerIds.length > 0 ? ownersItem.filter(owner => ownerIds.includes(owner.value)) : [];
        onFilterChange({ users: currentUsers, excludeOutsideOrgUnit: excludeOrgUnit, owners: currentOwners });
    }, [onFilterChange, ownersItem, ownerIds, excludeOrgUnit, currentUsers]);

    return (
        <Container>
            <IconButton aria-label={i18n.t("Filters")} onClick={() => setOpenFilterDialog(true)}>
                <FilterIcon />
            </IconButton>
            <ConfirmationDialog
                saveText={i18n.t("Close")}
                onSave={updateExcludeOrgUnit}
                open={openFilterDialog}
                maxWidth="lg"
                title={i18n.t("Filters")}
            >
                <FilterRowContainer>
                    {showOrgUnitFilter && (
                        <FormControlLabel
                            control={
                                <Switch checked={excludeOrgUnit} onChange={e => setExcludeOrgUnit(e.target.checked)} />
                            }
                            label={i18n.t("Show only users assigned to my organization unit and below")}
                        />
                    )}

                    <div>
                        {showUserFilter && (
                            <DropdownForm label={!users ? i18n.t("Loading...") : filterUserLabel}>
                                <Select value="value" onOpen={openUserFilterModal} open={false}>
                                    <MenuItem value="value">
                                        {formatItemsDisplay(currentUsers.map(user => user.text))}
                                    </MenuItem>
                                </Select>
                            </DropdownForm>
                        )}

                        {showUserFilterModal && (
                            <ConfirmationDialog
                                cancelText={i18n.t("Clear")}
                                saveText={i18n.t("Save")}
                                onSave={updateSelectedUsers}
                                open={showUserFilterModal}
                                onCancel={() => {
                                    setShowUserFilterModal(false);
                                    selectedIds([]);
                                    onFilterChange({ users: [], excludeOutsideOrgUnit: excludeOrgUnit, owners: [] });
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

                    <div>
                        {showOwnerFilter && (
                            <DropdownForm label={i18n.t("Owners")}>
                                <Select value="value" onOpen={openOwnerFilterModal} open={false}>
                                    <MenuItem value="value">
                                        {formatItemsDisplay(currentOwners.map(owner => owner.text))}
                                    </MenuItem>
                                </Select>
                            </DropdownForm>
                        )}

                        {showOwnerFilterModal && (
                            <ConfirmationDialog
                                cancelText={i18n.t("Clear")}
                                saveText={i18n.t("Save")}
                                onSave={updateSelectedOwners}
                                open={showOwnerFilterModal}
                                onCancel={() => {
                                    setShowOwnerFilterModal(false);
                                    selectedOwnerIds([]);
                                    onFilterChange({ users: [], excludeOutsideOrgUnit: excludeOrgUnit, owners: [] });
                                }}
                                maxWidth="lg"
                                title={i18n.t("Select owners")}
                            >
                                <MultiSelector
                                    d2={{}}
                                    onChange={selectedOwnerIds}
                                    options={ownersItem}
                                    selected={ownerIds}
                                    searchFilterLabel={i18n.t("Search")}
                                />
                            </ConfirmationDialog>
                        )}
                    </div>
                </FilterRowContainer>
            </ConfirmationDialog>
        </Container>
    );
});

export function useGetUsersSimple(props: { enabled: boolean }) {
    const { enabled } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const [users, setUsers] = React.useState<UserSimple[]>([]);

    React.useEffect(() => {
        if (!enabled) return;
        return compositionRoot.users.getInOrgUnits(currentUser).run(
            users => {
                setUsers(users);
            },
            error => console.error(error)
        );
    }, [compositionRoot.users, currentUser, enabled]);

    return { users };
}

export function useGetDashboardOwners(props: { enabled: boolean }) {
    const { enabled } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const [owners, setOwners] = React.useState<DashboardOwner[]>([]);

    React.useEffect(() => {
        if (!enabled) return;
        return compositionRoot.dashboards.getOwners.execute().run(setOwners, error => console.error(error));
    }, [compositionRoot.dashboards, currentUser, enabled]);

    return { owners };
}

export type FilteredUser = { value: Id; text: string };

export const Container = styled.div`
    display: flex;
    align-items: center;
`;

export const FilterRowContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1em;
`;

function formatItemsDisplay(values: string[], maxVisible = 3): string {
    const separator = ", ";
    if (values.length === 0) return "";
    if (values.length <= maxVisible) {
        return values.join(separator);
    }

    const visibleItems = values.slice(0, maxVisible);
    const remainingCount = values.length - maxVisible;
    const visibleNames = visibleItems.join(separator);

    return i18n.t(`${visibleNames} and ${remainingCount} more`);
}
