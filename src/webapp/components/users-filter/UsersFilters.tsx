import React from "react";
import { ConfirmationDialog, MultiSelector } from "@eyeseetea/d2-ui-components";
import { DropdownForm } from "@eyeseetea/d2-ui-components/dropdown/GenericDropdown";
import { Select, MenuItem } from "@material-ui/core";

import { Id } from "../../../domain/entities/Ref";
import { UserSimple } from "../../../domain/entities/UserSimple";
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";

type UsersFiltersProps = {
    onFilterChange: (filters: { users: FilteredUser[] }) => void;
};

export const UsersFilters: React.FC<UsersFiltersProps> = React.memo(props => {
    const { onFilterChange } = props;
    const [showSharing, setShowSharing] = React.useState(false);
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

    const currentUsers = ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];

    const updateSelectedUsers = React.useCallback(() => {
        setShowSharing(false);
        const currentUsers = ids.length > 0 ? usersItem.filter(user => ids.includes(user.value)) : [];
        onFilterChange({ users: currentUsers });
    }, [onFilterChange, usersItem, ids]);

    return (
        <div>
            <DropdownForm label={!users ? i18n.t("Loading users...") : i18n.t("Filter owners")}>
                <Select value="value" onOpen={openSharingDialog} open={false}>
                    <MenuItem value="value">{currentUsers.map(user => user.text).join(", ")}</MenuItem>
                </Select>
            </DropdownForm>

            {showSharing && (
                <ConfirmationDialog
                    cancelText={i18n.t("Clear")}
                    saveText={i18n.t("Save")}
                    onSave={updateSelectedUsers}
                    open={showSharing}
                    onCancel={() => {
                        setShowSharing(false);
                        selectedIds([]);
                        onFilterChange({ users: [] });
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
    );
});

export function useGetUsersSimple() {
    const { compositionRoot } = useAppContext();
    const [users, setUsers] = React.useState<UserSimple[]>([]);

    React.useEffect(
        () =>
            compositionRoot.users.getInOrgUnits().run(
                users => {
                    setUsers(users);
                },
                error => console.error(error)
            ),
        [compositionRoot.users]
    );

    return { users };
}

export type FilteredUser = { value: Id; text: string };
