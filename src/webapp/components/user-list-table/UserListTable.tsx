import {
    ConfirmationDialog,
    ConfirmationDialogProps,
    ObjectsList,
    ObjectsTableProps,
    Pager,
    TableColumn,
    TableConfig,
    TablePagination,
    TableSorting,
    useObjectsTable,
} from "@eyeseetea/d2-ui-components";
import { Icon } from "@material-ui/core";
import { Tune } from "@material-ui/icons";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import _ from "lodash";
import React, { useCallback, useMemo } from "react";
import { hasReplicateAuthority, User } from "../../../domain/entities/User";
import { assignToOrgUnits, goToUserEditPage } from "../../../legacy/List/context.actions";
import copyInUserStore from "../../../legacy/List/copyInUser.store";
import deleteUserStore from "../../../legacy/List/deleteUser.store";
import enableStore from "../../../legacy/List/enable.store";
import replicateUserStore from "../../../legacy/List/replicateUser.store";
import userGroupsAssignmentDialogStore from "../../../legacy/List/userGroups.store";
import userRolesAssignmentDialogStore from "../../../legacy/List/userRoles.store";
import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";

export const UserListTable: React.FC<UserListTableProps> = props => {
    const { compositionRoot, currentUser } = useAppContext();

    const [dialogProps, _openDialog] = React.useState<ConfirmationDialogProps>();

    const enableReplicate = hasReplicateAuthority(currentUser);

    const baseConfig = useMemo((): TableConfig<User> => {
        return {
            columns,
            details: [],
            actions: [
                {
                    name: "details",
                    text: i18n.t("Details"),
                    multiple: false,
                    primary: true,
                },
                {
                    name: "copy_in_user",
                    text: i18n.t("Copy in user"),
                    icon: <Icon>content_copy</Icon>,
                    multiple: false,
                    onClick: user => copyInUserStore.setState({ user, open: true }),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: "assign_to_org_units_capture",
                    text: i18n.t("Assign to organisation units"),
                    multiple: true,
                    icon: <Icon>business</Icon>,
                    onClick: users => assignToOrgUnits(users, "organisationUnits", "assign_to_org_units_capture"),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: "assign_to_org_units_output",
                    text: i18n.t("Assign to data view organisation units"),
                    multiple: true,
                    icon: <Icon>business</Icon>,
                    onClick: users =>
                        assignToOrgUnits(users, "dataViewOrganisationUnits", "assign_to_org_units_output"),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: "assign_roles",
                    text: i18n.t("Assign roles"),
                    multiple: true,
                    icon: <Icon>assignment</Icon>,
                    onClick: users => userRolesAssignmentDialogStore.setState({ users, open: true }),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: "assign_groups",
                    text: i18n.t("Assign groups"),
                    icon: <Icon>group_add</Icon>,
                    multiple: true,
                    onClick: users => userGroupsAssignmentDialogStore.setState({ users, open: true }),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: "edit",
                    text: i18n.t("Edit"),
                    icon: <Icon>edit</Icon>,
                    multiple: false,
                    onClick: user => goToUserEditPage(user),
                    isActive: checkAccess(["update"]),
                },
                {
                    name: "enable",
                    text: i18n.t("Enable"),
                    icon: <Icon>playlist_add_check</Icon>,
                    multiple: true,
                    onClick: users => enableStore.setState({ users, action: "enable" }),
                    isActive: isStateActionVisible("enable"),
                },
                {
                    name: "disable",
                    text: i18n.t("Disable"),
                    icon: <Icon>block</Icon>,
                    multiple: true,
                    onClick: users => enableStore.setState({ users, action: "disable" }),
                    isActive: isStateActionVisible("disable"),
                },
                {
                    name: "remove",
                    text: i18n.t("Remove"),
                    icon: <Icon>delete</Icon>,
                    multiple: true,
                    onClick: datasets => deleteUserStore.delete(datasets),
                    isActive: checkAccess(["delete"]),
                },
                {
                    name: "replicate_user_from_template",
                    text: i18n.t("Replicate user from template"),
                    icon: <FileCopyIcon />,
                    multiple: false,
                    onClick: users => replicateUserStore.setState({ open: true, user: users[0], type: "template" }),
                    isActive: () => enableReplicate,
                },
                {
                    name: "replicate_user_from_table",
                    text: i18n.t("Replicate user from table"),
                    icon: <Icon>toc</Icon>,
                    multiple: false,
                    onClick: users => replicateUserStore.setState({ open: true, user: users[0], type: "table" }),
                    isActive: () => enableReplicate,
                },
            ],
            globalActions: [
                {
                    name: "open-settings",
                    text: i18n.t("Settings"),
                    icon: <Tune />,
                    onClick: () => props.openSettings(),
                },
            ],
            // TODO: Bug in ObjectsList
            initialSorting: {
                field: "firstName",
                order: "asc",
            },
            initialState: {
                sorting: {
                    field: "firstName",
                    order: "asc",
                },
            },
            paginationOptions: {
                pageSizeOptions: [10, 25, 50, 100],
                pageSizeInitialValue: 25,
            },
            searchBoxLabel: i18n.t("Search by name"),
        };
    }, [props, enableReplicate]);

    const refreshRows = useCallback(
        (
            _search: string,
            _paging: TablePagination,
            _sorting: TableSorting<User>
        ): Promise<{ objects: User[]; pager: Pager }> => {
            return compositionRoot.users.list().toPromise();
        },
        [compositionRoot]
    );

    const tableProps = useObjectsTable(baseConfig, refreshRows);

    return (
        <React.Fragment>
            {dialogProps && <ConfirmationDialog open={true} maxWidth={"lg"} fullWidth={true} {...dialogProps} />}

            <ObjectsList {...tableProps}>{props.children}</ObjectsList>
        </React.Fragment>
    );
};

export const columns: TableColumn<User>[] = [
    { name: "firstName", sortable: true, text: i18n.t("First name") },
    { name: "surname", sortable: true, text: i18n.t("Surname") },
    { name: "username", sortable: false, text: i18n.t("Username") },
    { name: "email", sortable: false, text: i18n.t("Email") },
    { name: "created", sortable: true, text: i18n.t("Created"), hidden: true },
    { name: "lastUpdated", sortable: true, text: i18n.t("Last updated"), hidden: true },
    { name: "userRoles", sortable: false, text: i18n.t("Roles"), hidden: true },
    { name: "userGroups", sortable: false, text: i18n.t("Groups"), hidden: true },
    { name: "organisationUnits", sortable: false, text: i18n.t("Organisation units") },
    { name: "dataViewOrganisationUnits", sortable: false, text: i18n.t("Data view organisation units") },
    { name: "lastLogin", sortable: false, text: i18n.t("Last login") },
    { name: "disabled", sortable: false, text: i18n.t("Disabled") },
];

function checkAccess(requiredKeys: string[]) {
    return (users: User[]) =>
        _(users).every(user => {
            const permissions = _(user.access).pickBy().keys().value();
            return _(requiredKeys).difference(permissions).isEmpty();
        });
}

function isStateActionVisible(action: string) {
    const currentUserHasUpdateAccessOn = checkAccess(["update"]);
    const requiredDisabledValue = action === "enable";

    return (users: User[]) =>
        currentUserHasUpdateAccessOn(users) && _(users).some(user => user.disabled === requiredDisabledValue);
}

type BaseTableProps = Pick<ObjectsTableProps<User>, "loading">;
export interface UserListTableProps extends BaseTableProps {
    openSettings: () => void;
}