import React from "react";
import { ConfirmationDialog, MultiSelector } from "@eyeseetea/d2-ui-components";
import { DropdownForm } from "@eyeseetea/d2-ui-components/dropdown/GenericDropdown";
import { Select, MenuItem, Switch, FormControlLabel } from "@material-ui/core";

import { Id } from "../../../domain/entities/Ref";
import { UserSimple } from "../../../domain/entities/UserSimple";
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";
import styled from "styled-components";
import { FilterButton } from "../filter-button/FilterButton";

export type UsersFiltersProps = {
    onFilterChange: (filters: {
        users: FilteredUser[];
        excludeOutsideOrgUnit: boolean;
        filterEmptyUsers: boolean;
    }) => void;
    showUserFilter?: boolean;
    showOwnerFilter?: boolean;
    showOrgUnitFilter?: boolean;
    filterUserLabel?: string;
    showEmptyUsers?: boolean;
};

export const UsersFilters: React.FC<UsersFiltersProps> = React.memo(props => {
    const { onFilterChange, showUserFilter, showOrgUnitFilter, filterUserLabel = "", showEmptyUsers } = props;

    const [filterEmptyUsers, setFilterEmptyUsers] = React.useState(true);
    const [showUserFilterModal, setShowUserFilterModal] = React.useState(false);
    const [openFilterDialog, setOpenFilterDialog] = React.useState(false);
    const [excludeOrgUnit, setExcludeOrgUnit] = React.useState(true);
    const [ids, selectedIds] = React.useState<Id[]>([]);
    const { users } = useGetUsersSimple({
        enabled: showUserFilter ?? false,
        restrictToOrgUnits: excludeOrgUnit,
    });

    const openUserFilterModal = React.useCallback(() => {
        if (users && users?.length > 0) {
            setShowUserFilterModal(true);
        }
    }, [users]);

    const usersItem = React.useMemo(() => {
        if (!users) return [];
        return users.map(user => {
            return { text: user.fullUserName, value: user.id };
        });
    }, [users]);

    const currentUsers = React.useMemo(() => {
        return ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
    }, [ids, usersItem]);

    const updateSelectedUsers = React.useCallback(() => {
        setShowUserFilterModal(false);
        const currentUsers = ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
        onFilterChange({
            users: currentUsers,
            excludeOutsideOrgUnit: excludeOrgUnit,
            filterEmptyUsers: filterEmptyUsers,
        });
    }, [onFilterChange, usersItem, ids, excludeOrgUnit, filterEmptyUsers]);

    const updateExcludeOrgUnit = React.useCallback(() => {
        onFilterChange({
            users: currentUsers,
            excludeOutsideOrgUnit: excludeOrgUnit,
            filterEmptyUsers: filterEmptyUsers,
        });
        setOpenFilterDialog(false);
    }, [onFilterChange, currentUsers, excludeOrgUnit, filterEmptyUsers]);

    const orgUnitLabel = i18n.t("Show only users assigned to my organization unit and below");

    const selectedFiltersText = React.useMemo(() => {
        const userFilter =
            currentUsers.length > 0
                ? i18n.t("Users: {{users}}", {
                      nsSeparator: false,
                      users: formatItemsDisplay(currentUsers.map(u => u.text)),
                  })
                : undefined;

        return [userFilter].filter(Boolean).join("; ");
    }, [currentUsers]);

    return (
        <Container>
            <FilterButton
                tooltipLabel={selectedFiltersText}
                onClick={() => setOpenFilterDialog(true)}
                buttonActive={selectedFiltersText.length > 0 || excludeOrgUnit || filterEmptyUsers}
            />
            <ConfirmationDialog
                saveText={i18n.t("Close")}
                onSave={updateExcludeOrgUnit}
                open={openFilterDialog}
                title={i18n.t("Filters")}
            >
                <FilterRowContainer>
                    {showOrgUnitFilter && (
                        <FormControlLabel
                            control={
                                <Switch checked={excludeOrgUnit} onChange={e => setExcludeOrgUnit(e.target.checked)} />
                            }
                            label={orgUnitLabel}
                        />
                    )}

                    {showEmptyUsers && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={filterEmptyUsers}
                                    onChange={e => setFilterEmptyUsers(e.target.checked)}
                                />
                            }
                            label={i18n.t("Hide not applicable user groups")}
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
                                    onFilterChange({
                                        users: [],
                                        excludeOutsideOrgUnit: excludeOrgUnit,
                                        filterEmptyUsers: filterEmptyUsers,
                                    });
                                }}
                                title={i18n.t("Select users")}
                                fullWidth
                                maxWidth="md"
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

export function useGetUsersSimple(props: { enabled: boolean; restrictToOrgUnits: boolean }) {
    const { enabled, restrictToOrgUnits } = props;
    const { compositionRoot, currentUser } = useAppContext();
    const [users, setUsers] = React.useState<UserSimple[]>([]);

    React.useEffect(() => {
        if (!enabled) return;
        const future = restrictToOrgUnits
            ? compositionRoot.users.getInOrgUnits(currentUser)
            : compositionRoot.users.getAllSimple(currentUser);
        return future.run(
            loadedUsers => {
                setUsers(loadedUsers);
            },
            error => console.error(error)
        );
    }, [compositionRoot.users, currentUser, enabled, restrictToOrgUnits]);

    return { users };
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

export function formatItemsDisplay(values: string[], maxVisible = 3): string {
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
