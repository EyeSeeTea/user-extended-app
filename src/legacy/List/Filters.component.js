import _ from "lodash";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import { SegmentedControl } from "@dhis2/ui";
import { Box } from "@material-ui/core";
import Checkbox from "material-ui/Checkbox/Checkbox";
import IconButton from "material-ui/IconButton";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import FilterListIcon from "material-ui/svg-icons/content/filter-list";
import memoize from "memoize-weak";
import PropTypes from "prop-types";
import React from "react";
import MultipleFilter from "../components/MultipleFilter.component";
import OrgUnitsSelectorFilter from "../components/OrgUnitsSelectorFilter";
import listActions from "./list.actions";
import listStore from "./list.store";
import Dropdown from "../components/Dropdown.component";
import { DEFAULT_SHOW_ONLY_ACTIVE_USERS } from "./List.component";

export default class Filters extends React.Component {
    static contextTypes = {
        d2: PropTypes.object.isRequired,
    };

    static propTypes = {
        onChange: PropTypes.func.isRequired,
        onlyActiveUsers: PropTypes.bool,
        areFiltersOverrided: PropTypes.bool,
        hideUsersCanManageFilter: PropTypes.bool,
        onlyUsersOrgUnits: PropTypes.bool,
        setOnlyUsersOrgUnits: PropTypes.func.isRequired,
        isSuperAdmin: PropTypes.bool,
    };

    styles = {
        wrapper: {
            flex: "unset",
        },
        paper: {
            paddingLeft: 20,
            paddingBottom: 2,
            marginTop: 40,
        },
        filterStyles: {
            textField: {
                width: "100%",
            },
        },
        dropdownStyles: {
            width: "100%",
        },
        animationVisible: {
            width: 850,
        },
        animationHidden: {
            width: 0,
        },
        clearFiltersButton: {
            marginRight: 25,
            marginLeft: "auto",
        },
        filterBehavior: {
            display: "flex",
            alignItems: "center",
            columnGap: 6,
        },
    };

    constructor(props, context) {
        super(props);

        const { i18n } = context.d2;

        this.getTranslation = i18n.getTranslation.bind(i18n);
        this.setFilter = memoize(this._setFilter);

        this.state = {
            showExtendedFilters: false,
            searchString: "",
            searchStringClear: null,
            showOnlyManagedUsers: false,
            userRoles: [],
            userGroups: [],
            orgUnits: [],
            orgUnitsOutput: [],
            searchOrgUnits: [],
            userDisabled: this.props.onlyActiveUsers ? false : null,
            twoFactorEnabled: null,
            externalAuth: null,
            userRolesAll: [],
            userGroupsAll: [],
            rootJunction: this.props.areFiltersOverrided ? "AND" : "OR",
            onlyUsersOrgUnits: this.props.onlyUsersOrgUnits,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.onlyActiveUsers !== this.props.onlyActiveUsers) {
            this.setState({ userDisabled: this.props.onlyActiveUsers ? false : null }, this.notifyParent);
        }
        if (prevProps.areFiltersOverrided !== this.props.areFiltersOverrided) {
            this.setState({ rootJunction: this.props.areFiltersOverrided ? "AND" : "OR" }, this.notifyParent);
        }
        if (prevProps.onlyUsersOrgUnits !== this.props.onlyUsersOrgUnits) {
            this.setState({ onlyUsersOrgUnits: this.props.onlyUsersOrgUnits }, this.notifyParentOnlyUsersOrgUnits);
        }
    }

    componentWillMount = () => {
        this.observerDisposables = [];
    };

    componentWillUnmount = () => {
        this.observerDisposables.forEach(disposable => disposable.dispose?.());
    };

    registerDisposable = disposable => {
        this.observerDisposables.push(disposable);
    };

    componentDidMount = () => {
        listActions.loadUserRoles.next();
        listActions.loadUserGroups.next();
        const toOptions = objs => objs.toArray().map(obj => ({ value: obj.id, text: obj.displayName }));

        this.registerDisposable(
            listStore.listRolesSubject.subscribe(userRoles => {
                this.setState({ userRolesAll: toOptions(userRoles) });
            })
        );

        this.registerDisposable(
            listStore.listGroupsSubject.subscribe(userGroups => {
                this.setState({ userGroupsAll: toOptions(userGroups) });
            })
        );
    };

    openFilters = () => {
        this.setState({ showExtendedFilters: true });
    };

    closeFilters = () => {
        this.setState({ showExtendedFilters: false });
    };

    searchListByName = searchObserver => {
        this.registerDisposable(
            searchObserver.subscribe(value => this.setState({ searchString: value }, this.notifyParent))
        );
    };

    getFilterOptions = () => {
        const {
            showOnlyManagedUsers,
            searchString,
            userRoles,
            userGroups,
            userDisabled,
            twoFactorEnabled,
            externalAuth,
            orgUnits,
            orgUnitsOutput,
            searchOrgUnits,
            rootJunction,
        } = this.state;

        const inFilter = field => (_(field).isEmpty() ? null : ["in", field]);

        return {
            ...(showOnlyManagedUsers ? { canManage: "true" } : {}),
            ...(searchString ? { query: searchString } : {}),
            ...(rootJunction ? { rootJunction } : {}),
            filters: {
                "userCredentials.disabled": userDisabled !== null ? ["eq", userDisabled] : undefined,
                "userCredentials.twoFA": twoFactorEnabled !== null ? ["eq", twoFactorEnabled] : undefined,
                "userCredentials.externalAuth": externalAuth !== null ? ["eq", externalAuth] : undefined,
                "userCredentials.userRoles.id": inFilter(userRoles),
                "userGroups.id": inFilter(userGroups),
                "organisationUnits.id": inFilter(orgUnits.map(ou => ou.id)),
                "dataViewOrganisationUnits.id": inFilter(orgUnitsOutput.map(ou => ou.id)),
                "teiSearchOrganisationUnits.id": inFilter(searchOrgUnits.map(ou => ou.id)),
            },
        };
    };

    clearFilters = () => {
        this.setState({ onlyUsersOrgUnits: DEFAULT_SHOW_ONLY_ACTIVE_USERS }, this.notifyParentOnlyUsersOrgUnits);
        this.setState(
            {
                showOnlyManagedUsers: false,
                searchStringClear: new Date(),
                userGroups: [],
                userRoles: [],
                userDisabled: this.props.onlyActiveUsers ? false : null,
                twoFactorEnabled: null,
                externalAuth: null,
                orgUnits: [],
                orgUnitsOutput: [],
                searchOrgUnits: [],
                rootJunction: this.props.areFiltersOverrided ? "AND" : "OR",
            },
            this.notifyParent
        );
    };

    notifyParentOnlyUsersOrgUnits = () => {
        this.props.setOnlyUsersOrgUnits(this.state.onlyUsersOrgUnits);
    };

    notifyParent = () => {
        const filterOptions = this.getFilterOptions();
        this.props.onChange(filterOptions);
    };

    _setFilter = (key, getter) => {
        const notify = key === "onlyUsersOrgUnits" ? this.notifyParentOnlyUsersOrgUnits : this.notifyParent;

        return (...args) => {
            const newValue = getter ? getter(...args) : args[0];
            this.setState({ [key]: newValue }, notify);
        };
    };

    checkboxHandler = (ev, isChecked) => isChecked;
    dropdownHandler = ev => ev.target.value;

    render() {
        const {
            userGroups,
            userRoles,
            userDisabled,
            orgUnits,
            orgUnitsOutput,
            searchOrgUnits,
            showOnlyManagedUsers,
            onlyUsersOrgUnits,
            showExtendedFilters,
            rootJunction,
        } = this.state;

        const { isSuperAdmin, areFiltersOverrided, hideUsersCanManageFilter } = this.props;

        const { styles } = this;

        const isExtendedFiltering =
            showOnlyManagedUsers ||
            onlyUsersOrgUnits ||
            userDisabled ||
            !_([userGroups, userRoles, orgUnits, orgUnitsOutput, searchOrgUnits]).every(_.isEmpty);
        const isFiltering = showOnlyManagedUsers || isExtendedFiltering;
        const filterIconColor = isExtendedFiltering ? "#ff9800" : undefined;
        const filterButtonColor = showExtendedFilters ? { backgroundColor: "#cdcdcd" } : undefined;

        const activeInactiveOptions = [
            { value: false, text: this.getTranslation("active") },
            { value: true, text: this.getTranslation("inactive") },
        ];

        const forcedFilterOptions = [{ value: false, text: this.getTranslation("filter_active_modified") }];

        const enabledDisabledOptions = [
            { value: true, text: this.getTranslation("enabled") },
            { value: false, text: this.getTranslation("disabled") },
        ];

        return (
            <div className="user-management-controls" style={styles.wrapper}>
                <div className="user-management-control search-box">
                    <IconButton
                        className="expand-filters"
                        onClick={this.openFilters}
                        tooltip={this.getTranslation("extended_filters")}
                        style={filterButtonColor}
                    >
                        <FilterListIcon color={filterIconColor} />
                    </IconButton>
                </div>

                <ConfirmationDialog
                    title={this.getTranslation("extended_filters")}
                    maxWidth={"lg"}
                    fullWidth={true}
                    open={showExtendedFilters}
                    onCancel={this.closeFilters}
                    cancelText={this.getTranslation("close")}
                    infoActionText={this.getTranslation("clear_filters")}
                    onInfoAction={isFiltering ? this.clearFilters : undefined}
                >
                    <div style={{ padding: "0.5em", margin: "0.5em" }}>
                        <Box display="flex" alignItems="center" width="100%" marginBottom={1.5}>
                            <Box display="flex" flexGrow={1} flexDirection={"column"} gridRowGap="1em">
                                {!hideUsersCanManageFilter && (
                                    <Checkbox
                                        className="control-checkbox"
                                        label={this.getTranslation("display_only_users_can_manage")}
                                        onCheck={this.setFilter("showOnlyManagedUsers", this.checkboxHandler)}
                                        checked={showOnlyManagedUsers}
                                    />
                                )}
                                <Checkbox
                                    className="control-checkbox"
                                    label={this.getTranslation("only_users_assigned_to_org_unit")}
                                    onCheck={this.setFilter("onlyUsersOrgUnits", this.checkboxHandler)}
                                    checked={onlyUsersOrgUnits}
                                />
                            </Box>
                        </Box>
                        <Box display="flex" justifyContent="flex-end">
                            <Box display="flex" gridColumnGap="1.5em">
                                <span style={styles.filterBehavior}>
                                    {this.getTranslation("Filtering_behavior")}
                                    <InfoOutlinedIcon
                                        fontSize="small"
                                        titleAccess={this.getTranslation("Active_in_advanced_only")}
                                    />
                                </span>
                                <Box
                                    display="inline"
                                    title={
                                        areFiltersOverrided
                                            ? this.getTranslation("filter_modified_on_settings")
                                            : undefined
                                    }
                                >
                                    <SegmentedControl
                                        options={[
                                            {
                                                label: this.getTranslation("OR"),
                                                value: "OR",
                                                disabled: areFiltersOverrided,
                                            },
                                            {
                                                label: this.getTranslation("AND"),
                                                value: "AND",
                                            },
                                        ]}
                                        selected={rootJunction}
                                        onChange={({ value }) => {
                                            if (areFiltersOverrided) return;
                                            this.setState({ rootJunction: value ?? "OR" }, this.notifyParent);
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                        <div>
                            <div className="user-management-control select-active-or-inactive">
                                <Dropdown
                                    labelText={this.getTranslation("filter_active_inactive_users")}
                                    options={!isSuperAdmin ? forcedFilterOptions : activeInactiveOptions}
                                    value={this.state.userDisabled}
                                    onChange={this.setFilter("userDisabled", this.dropdownHandler)}
                                    style={styles.dropdownStyles}
                                    disabled={!isSuperAdmin}
                                />
                            </div>

                            <div className="user-management-control select-active-or-inactive">
                                <Dropdown
                                    labelText={this.getTranslation("filter_2fa_status")}
                                    options={enabledDisabledOptions}
                                    value={this.state.twoFactorEnabled}
                                    onChange={this.setFilter("twoFactorEnabled", this.dropdownHandler)}
                                    style={styles.dropdownStyles}
                                />
                            </div>

                            <div className="user-management-control select-active-or-inactive">
                                <Dropdown
                                    labelText={this.getTranslation("filter_externalAuth_status")}
                                    options={enabledDisabledOptions}
                                    value={this.state.externalAuth}
                                    onChange={this.setFilter("externalAuth", this.dropdownHandler)}
                                    style={styles.dropdownStyles}
                                />
                            </div>

                            <div className="user-management-control select-role">
                                <MultipleFilter
                                    title={this.getTranslation("filter_role")}
                                    options={this.state.userRolesAll}
                                    selected={this.state.userRoles}
                                    onChange={this.setFilter("userRoles")}
                                    styles={styles.filterStyles}
                                />
                            </div>

                            <div className="user-management-control select-group">
                                <MultipleFilter
                                    title={this.getTranslation("filter_group")}
                                    options={this.state.userGroupsAll}
                                    selected={this.state.userGroups}
                                    onChange={this.setFilter("userGroups")}
                                    styles={styles.filterStyles}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="user-management-control select-organisation-unit">
                                <OrgUnitsSelectorFilter
                                    api={this.props.api}
                                    title={this.getTranslation("filter_by_organisation_units_capture")}
                                    selected={this.state.orgUnits}
                                    onChange={this.setFilter("orgUnits")}
                                    styles={styles.filterStyles}
                                />
                            </div>

                            <div className="user-management-control select-organisation-unit-output">
                                <OrgUnitsSelectorFilter
                                    api={this.props.api}
                                    title={this.getTranslation("filter_by_organisation_units_output")}
                                    selected={this.state.orgUnitsOutput}
                                    onChange={this.setFilter("orgUnitsOutput")}
                                    styles={styles.filterStyles}
                                />
                            </div>

                            <div className="user-management-control select-search-organisation-unit">
                                <OrgUnitsSelectorFilter
                                    api={this.props.api}
                                    title={this.getTranslation("filter_by_search_organisation_units")}
                                    selected={this.state.searchOrgUnits}
                                    onChange={this.setFilter("searchOrgUnits")}
                                    styles={styles.filterStyles}
                                />
                            </div>
                        </div>
                    </div>
                </ConfirmationDialog>
            </div>
        );
    }
}
