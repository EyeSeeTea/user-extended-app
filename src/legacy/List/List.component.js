import MenuItem from "material-ui/MenuItem";
import ViewColumnIcon from "material-ui/svg-icons/action/view-column";
import PropTypes from "prop-types";
import React from "react";
import { UserListTable } from "../../webapp/components/user-list-table/UserListTable";
import ReplicateUserFromTable from "../../webapp/components/replicate/ReplicateUserFromTable";
import ReplicateUserFromTemplate from "../../webapp/components/replicate/ReplicateUserFromTemplate";
import Settings from "../models/settings";
import snackActions from "../Snackbar/snack.actions";
import Filters from "./Filters.component";
import { useAppSettingsContext } from "../../webapp/contexts/AppSettingsProvider";
import { isSuperAdmin } from "../../domain/entities/UserProps";
import { IconButton } from "@material-ui/core";

const initialSorting = ["name", "asc"];

export const DEFAULT_SHOW_ONLY_ACTIVE_USERS = false;

const ListHybridWrapper = props => {
    const { currentUser, currentUserHasAccessToSettings } = props.params;
    const { appSettings } = useAppSettingsContext();

    return (
        <ListHybrid
            {...props}
            isSuperAdmin={isSuperAdmin(currentUser)}
            onlyActiveUsers={appSettings.showOnlyActiveUsers}
            isSettingInactive={appSettings.status === "inactive"}
            appSettings={appSettings}
            currentUserHasAccessToSettings={currentUserHasAccessToSettings}
        />
    );
};

export { ListHybridWrapper as ListHybrid };

class ListHybrid extends React.Component {
    static contextTypes = {
        d2: PropTypes.object.isRequired,
    };

    maxImportUsers = 500;

    styles = {
        dataTableWrap: {
            display: "flex",
            flexDirection: "column",
            flex: 2,
        },
        listDetailsWrap: {
            flex: 1,
            display: "flex",
            flexOrientation: "row",
        },
    };

    componentDidMount = () => {
        this.setState({
            onlyUsersOrgUnits: this.props.appSettings.showOnlyUsersInTheirOrgUnits,
        });
    };

    componentWillUnmount = () => {
        this.observerDisposables.forEach(disposable => disposable.dispose?.());
        snackActions.hide();
    };

    registerDisposable = disposable => {
        this.observerDisposables.push(disposable);
    };

    getTranslation = (...args) => {
        return this.context.d2.i18n.getTranslation(...args);
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            reloadTableKey: 1,
            listFilterOptions: {},
            filters: getFilters({}, props),
            onlyUsersOrgUnits: DEFAULT_SHOW_ONLY_ACTIVE_USERS,
            pager: {
                total: 0,
            },
            isLoading: true,
            sorting: initialSorting,
            visibleColumns: [],
            sharing: {
                model: null,
                open: false,
            },
            translation: {
                model: null,
                open: false,
            },
            replicateUser: {
                open: false,
            },
            importUsers: {
                open: false,
            },
            copyUsers: {
                open: false,
            },
            disableUsers: {
                open: false,
                users: [],
                action: "",
            },
            removeUsers: {
                open: false,
                users: [],
            },
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.onlyActiveUsers !== this.props.onlyActiveUsers) {
            this.setState(
                state => ({
                    filters: getFilters(state.filters, this.props, prevProps),
                }),
                this.filterList
            );
        }
    }

    componentWillMount = () => {
        this.observerDisposables = [];

        Settings.build(this.context.d2).then(settings => {
            this.setState({
                settings: this.state.settings || settings,
                isLoading: false,
            });
        });

        this.filterList();
    };

    setAssignState = (key, value) => {
        this.setState({ [key]: value }, () => !value.open && this.filterList({ page: this.state.pager.page }));
    };

    componentWillReceiveProps(newProps) {
        if (this.props.params && newProps.params && this.props.params.modelType !== newProps.params.modelType) {
            this.setState({
                isLoading: true,
                translation: Object.assign({}, this.state.translation, { open: false }),
            });
        }
    }

    reloadTable = () => {
        this.setState({ reloadTableKey: this.state.reloadTableKey + 1 });
    };

    filterList = () => {
        const sorting = this.state.sorting ? { field: this.state.sorting[0], order: this.state.sorting[1] } : undefined;
        const { filters, query } = this.state;

        this.setState({ isLoading: true, listFilterOptions: { sorting, search: query, ...filters } });
    };

    convertObjsToMenuItems = objs => {
        const emptyEntry = <MenuItem key="_empty_item" value="" primaryText="" />;
        const entries = objs
            .toArray()
            .map(obj => <MenuItem key={obj.id} value={obj.id} primaryText={obj.displayName} />);
        return [emptyEntry].concat(entries);
    };

    onReplicateDialogClose = () => {
        this.setState({
            reloadTableKey: this.state.reloadTableKey + 1,
            replicateUser: { open: false, users: [] },
        });
    };

    getReplicateDialog = info => {
        const componentsByType = {
            replicate_template: ReplicateUserFromTemplate,
            replicate_table: ReplicateUserFromTable,
        };
        const ReplicateComponent = componentsByType[info.action];

        if (ReplicateComponent) {
            return (
                <ReplicateComponent
                    userToReplicateId={info.user}
                    onRequestClose={this.onReplicateDialogClose}
                    settings={this.state.settings}
                    api={this.props.api}
                    onlyUsersOrgUnits={this.state.onlyUsersOrgUnits}
                />
            );
        } else {
            throw new Error(`Unknown replicate dialog type: ${info.type}`);
        }
    };

    _getTableActions = () => {
        return (
            <div>
                <IconButton onClick={this._openLayoutSettings} tooltip={this.getTranslation("layout_settings")}>
                    <ViewColumnIcon />
                </IconButton>
            </div>
        );
    };

    _updateVisibleColumns = visibleColumns => {
        this.setState({ visibleColumns });
    };

    _updateQuery = query => {
        this.setState({ query }, this.filterList);
    };

    _onFiltersChange = filters => {
        const canManage = filters.canManage;
        this.setState({ filters, canManage }, this.filterList);
    };

    _onOnlyUsersOrgUnitsChange = onlyUsersOrgUnits => {
        this.setState({ onlyUsersOrgUnits });
    };

    _onAction = async (ids, action) => {
        if (action === "replicate_table" || action === "replicate_template") {
            this.setAssignState("replicateUser", { user: ids[0], open: true, action });
        } else if (action === "copy_in_user") {
            this.setAssignState("copyUsers", { users: ids, open: true, action });
        }
    };

    render() {
        const {
            replicateUser,
            listFilterOptions,
            onlyUsersOrgUnits = appSettings.showOnlyUsersInTheirOrgUnits,
        } = this.state;
        const { appSettings, onlyActiveUsers, isSuperAdmin, isSettingInactive } = this.props;

        const areFiltersOverrided = isSuperAdmin ? false : onlyActiveUsers;
        const hideUsersCanManageFilter = onlyActiveUsers && onlyUsersOrgUnits;

        return (
            <div>
                <div style={this.styles.listDetailsWrap}>
                    <div style={this.styles.dataTableWrap}>
                        <UserListTable
                            loading={this.state.isLoading}
                            filters={this.state.filters?.filters}
                            canManage={this.state?.canManage}
                            rootJunction={this.state.filters?.rootJunction}
                            onChangeVisibleColumns={this._updateVisibleColumns}
                            onChangeSearch={this._updateQuery}
                            reloadTableKey={this.state.reloadTableKey}
                            onAction={this._onAction}
                            filterOption={listFilterOptions}
                            onlyUsersOrgUnits={onlyUsersOrgUnits}
                        >
                            <Filters
                                onChange={this._onFiltersChange}
                                showSearch={false}
                                api={this.props.api}
                                onlyActiveUsers={onlyActiveUsers}
                                isSuperAdmin={isSuperAdmin}
                                areFiltersOverrided={areFiltersOverrided}
                                hideUsersCanManageFilter={hideUsersCanManageFilter}
                                onlyUsersOrgUnits={appSettings.showOnlyUsersInTheirOrgUnits}
                                setOnlyUsersOrgUnits={this._onOnlyUsersOrgUnitsChange}
                                isSettingInactive={isSettingInactive}
                                appSettings={appSettings}
                            />
                        </UserListTable>
                    </div>
                </div>

                {replicateUser.open ? this.getReplicateDialog(replicateUser) : null}
            </div>
        );
    }
}

function getFilters(filters, props, prevProps) {
    const areFiltersOverrided = props.onlyActiveUsers;
    const onlyActiveUsersChanged = prevProps?.onlyActiveUsers !== props.onlyActiveUsers;

    const disabledFilter = onlyActiveUsersChanged
        ? props.onlyActiveUsers
            ? false // show only active (disabled=false)
            : undefined
        : filters?.filters?.disabled;

    return {
        ...filters,
        rootJunction: areFiltersOverrided ? "AND" : filters.rootJunction ?? "OR",
        filters: {
            ...filters.filters,
            disabled: disabledFilter,
        },
    };
}
