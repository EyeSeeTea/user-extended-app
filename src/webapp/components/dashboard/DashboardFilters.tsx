import React from "react";
import { ConfirmationDialog, MultiSelector } from "@eyeseetea/d2-ui-components";
import { DropdownForm } from "@eyeseetea/d2-ui-components/dropdown/GenericDropdown";
import { Select, MenuItem } from "@material-ui/core";

import { Id, NamedRef } from "../../../domain/entities/Ref";
import i18n from "../../../utils/i18n";
import styled from "styled-components";
import { formatItemsDisplay } from "../users-filter/UsersFilters";
import { FilterButton } from "../filter-button/FilterButton";

export type DashboardsFiltersProps = {
    onFilterChange: (filters: { users: FilteredUser[]; owners: FilteredUser[] }) => void;
    owners: NamedRef[];
    users: NamedRef[];
};

export const DashboardFilters: React.FC<DashboardsFiltersProps> = React.memo(props => {
    const { onFilterChange, owners, users } = props;

    const [showUserFilterModal, setShowUserFilterModal] = React.useState(false);
    const [showOwnerFilterModal, setShowOwnerFilterModal] = React.useState(false);
    const [openFilterDialog, setOpenFilterDialog] = React.useState(false);
    const [ids, selectedIds] = React.useState<Id[]>([]);
    const [ownerIds, selectedOwnerIds] = React.useState<Id[]>([]);

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
            return { text: user.name, value: user.id };
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
        onFilterChange({ users: currentUsers, owners: currentOwners });
    }, [onFilterChange, usersItem, ids, currentOwners]);

    const updateExcludeOrgUnit = React.useCallback(() => {
        onFilterChange({ users: currentUsers, owners: currentOwners });
        setOpenFilterDialog(false);
    }, [onFilterChange, currentUsers, currentOwners]);

    const updateSelectedOwners = React.useCallback(() => {
        setShowOwnerFilterModal(false);
        const currentOwners = ownerIds.length > 0 ? ownersItem.filter(owner => ownerIds.includes(owner.value)) : [];
        onFilterChange({ users: currentUsers, owners: currentOwners });
    }, [onFilterChange, ownersItem, ownerIds, currentUsers]);

    const selectedFiltersText = React.useMemo(() => {
        const ownerFilter =
            currentOwners.length > 0
                ? i18n.t("Owners: {{owners}}", {
                      nsSeparator: false,
                      owners: formatItemsDisplay(currentOwners.map(o => o.text)),
                  })
                : undefined;

        const userFilter =
            currentUsers.length > 0
                ? i18n.t("Users: {{users}}", {
                      nsSeparator: false,
                      users: formatItemsDisplay(currentUsers.map(u => u.text)),
                  })
                : undefined;

        return [ownerFilter, userFilter].filter(Boolean).join("; ");
    }, [currentOwners, currentUsers]);

    return (
        <Container>
            <FilterButton
                tooltipLabel={selectedFiltersText}
                onClick={() => setOpenFilterDialog(true)}
                buttonActive={selectedFiltersText.length > 0}
            />
            <ConfirmationDialog
                saveText={i18n.t("Close")}
                onSave={updateExcludeOrgUnit}
                open={openFilterDialog}
                title={i18n.t("Filters")}
            >
                <FilterRowContainer>
                    <div>
                        <DropdownForm label={i18n.t("Owners")}>
                            <Select value="value" onOpen={openOwnerFilterModal} open={false}>
                                <MenuItem value="value">
                                    {formatItemsDisplay(currentOwners.map(owner => owner.text))}
                                </MenuItem>
                            </Select>
                        </DropdownForm>

                        {showOwnerFilterModal && (
                            <ConfirmationDialog
                                cancelText={i18n.t("Clear")}
                                saveText={i18n.t("Save")}
                                onSave={updateSelectedOwners}
                                open={showOwnerFilterModal}
                                onCancel={() => {
                                    setShowOwnerFilterModal(false);
                                    selectedOwnerIds([]);
                                    onFilterChange({ users: [], owners: [] });
                                }}
                                fullWidth
                                maxWidth="md"
                                title={i18n.t("Select owners")}
                            >
                                <MultiSelector
                                    onChange={selectedOwnerIds}
                                    options={ownersItem}
                                    selected={ownerIds}
                                    searchFilterLabel={i18n.t("Search")}
                                />
                            </ConfirmationDialog>
                        )}
                    </div>

                    <div>
                        <DropdownForm label={i18n.t("Users")}>
                            <Select value="value" onOpen={openUserFilterModal} open={false}>
                                <MenuItem value="value">
                                    {formatItemsDisplay(currentUsers.map(user => user.text))}
                                </MenuItem>
                            </Select>
                        </DropdownForm>

                        {showUserFilterModal && (
                            <ConfirmationDialog
                                cancelText={i18n.t("Clear")}
                                saveText={i18n.t("Save")}
                                onSave={updateSelectedUsers}
                                open={showUserFilterModal}
                                onCancel={() => {
                                    setShowUserFilterModal(false);
                                    selectedIds([]);
                                    onFilterChange({ users: [], owners: [] });
                                }}
                                fullWidth
                                maxWidth="md"
                                title={i18n.t("Select users")}
                            >
                                <MultiSelector
                                    onChange={selectedIds}
                                    options={usersItem}
                                    selected={ids}
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
