import React from 'react';
import _ from 'lodash';
import memoize from 'memoize-weak';
import camelCaseToUnderscores from 'd2-utilizr/lib/camelCaseToUnderscores'
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog/Dialog';
import FlatButton from 'material-ui/FlatButton/FlatButton';
import TextField from 'material-ui/TextField/TextField';
import RaisedButton from 'material-ui/RaisedButton/RaisedButton';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import Chip from 'material-ui/Chip';
import Toggle from 'material-ui/Toggle/Toggle';
import Validators from 'd2-ui/lib/forms/Validators';
import FormBuilder from 'd2-ui/lib/forms/FormBuilder.component';
import { generateUid } from 'd2/lib/uid';
import { OrderedMap } from 'immutable';
import FontIcon from 'material-ui/FontIcon';
import IconButton from 'material-ui/IconButton';

import { toBuilderValidator, validateUsername, validatePassword } from '../utils/validators';
import User from '../models/user';
import { getExistingUsers } from '../models/userHelpers'
import snackActions from '../Snackbar/snack.actions';
import LoadingMask from '../loading-mask/LoadingMask.component';
import InfoDialog from './InfoDialog';
import MultipleSelector from './MultipleSelector.component';
import { getModelValuesByField } from '../utils/dhis2Helpers';
import { getCompactTextForModels } from '../utils/i18n';
import { getOrgUnitsRoots } from '../utils/dhis2Helpers';

const styles = {
    dialog: {
        width: '95%',
        maxWidth: 'none',
    },
    dialogBody: {
        paddingTop: '10px',
    },
    addRowButton: {
        marginTop: 20,
        textAlign: "center",
    },
    header: {
        fontWeight: "bold",
        fontSize: "1.2em",
    },
    row: {
        border: "none",
    },
    rowExistingUser: {
      border: "none",
      backgroundColor: "#FDD",
    },
    removeIcon: {
        cursor: 'pointer',
    },
    warningsInfo: {
        textAlign: "left",
        float: "left",
        marginLeft: "20px",
    },
    overwriteToggle: {
        float: "left",
        textAlign: "left",
        width: "33%",
        marginLeft: "20px",
    },
    tableColumn: {
        width: 75,
    },
    actionsHeader: {
        width: 50,
        paddingLeft: '10px',
        paddingRight: '10px',
        overflow: 'visible',
    },
    cancelButton: {
        marginRight: 16,
    },
};
                                
class ImportTable extends React.Component {
    constructor(props, context) {
        super(props);

        const { d2 } = context;
        this.t = d2.i18n.getTranslation.bind(d2.i18n);
        this.getFieldsInfo = memoize(this.getFieldsInfo.bind(this));

        this.getRemoveRowHandler = memoize(userId => () => this.removeRow(userId));
        this.getOnUpdateField = memoize(userId => (...args) => this.onUpdateField(userId, ...args));
        this.getOnUpdateFormStatus = memoize(userId => (...args) => this.onUpdateFormStatus(userId, ...args));
        this.getActionsByState = memoize(this.getActionsByState.bind(this));
        this.getOnTextFieldClicked = memoize((...args) => (ev) => this.onTextFieldClicked(...args));

        this.fieldsInfo = this.getFieldsInfo();
        this.usersValidation = {} // {USER_ID: true | false}
        this.validateOnRender = true;

        this.state = {
            existingUsernames: null, // Set()
            infoDialog: null, // {title, body}
            isLoading: true,
            users: new OrderedMap(),
            areUsersValid: false,
            allowOverwrite: false,
            multipleSelector: null,
            modelValuesByField: null,
        };
    }

    async componentDidMount() {
        const { d2 } = this.context;
        const { users: usersArray, columns } = this.props;

        const modelValuesByField = await getModelValuesByField(d2, columns);
        const orgUnitRoots = await getOrgUnitsRoots();
        const existingUsers = await getExistingUsers(d2);
        const getUsername = user => user.userCredentials.username;
        const existingUsernames = new Set(existingUsers.map(getUsername));

        const usersById = _(usersArray)
            .sortBy(user => !existingUsernames.has(user.username))
            .map(user => ({ id: generateUid(), ...user }))
            .map(user => [user.id, user])
            .value();

        this.setState({
            isLoading: false,
            existingUsernames,
            users: new OrderedMap(usersById),
            modelValuesByField,
            orgUnitRoots,
        });
    }

    getActionsByState(allowOverwrite, showOverwriteToggle, showProcessButton) {
        const { onRequestClose, warnings, actionText } = this.props;

        return _.compact([
            warnings.length > 0 && (
                <span style={styles.warningsInfo} title={warnings.join("\n")}>
                    {warnings.length} {this.t('warnings')}
                </span>
            ),
            showOverwriteToggle && (<Toggle
                    label={this.t('overwrite_existing_users')}
                    labelPosition="right"
                    toggled={allowOverwrite}
                    onToggle={this.toggleAllowOverwrite}
                    style={styles.overwriteToggle}
                />
            ),
            <FlatButton
                label={this.t('close')}
                onClick={onRequestClose}
                style={styles.cancelButton}
            />,
            <RaisedButton
                primary={true}
                label={actionText}
                disabled={!showProcessButton}
                onClick={this.onSave}
            />,
        ]);
    }

    getUser(userId) {
        const { users } = this.state;
        const user = users.get(userId);

        if (user) {
            return user;
        } else {
            throw new Error("Cannot get user with ID: " + userId);
        }
    }

    onUpdateField(userId, name, value) {
        const { users } = this.state;
        const user = this.getUser(userId);
        const newUsers = users.set(userId, { ...user, [name]: value });
        this.setState({ users: newUsers });
    }

    onUpdateFormStatus(userId, formStatus) {
        const { users } = this.state;
        const { usersValidation } = this;
        const isValid = !formStatus.asyncValidating && formStatus.valid;
        const newUsersValidation = { ...usersValidation, [userId]: isValid };
        this.usersValidation = newUsersValidation;
        const areUsersValid = users.keySeq().every(userId => newUsersValidation[userId]);
        this.setState({ areUsersValid });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (this.props !== nextProps || !_.isEqual(this.state, nextState));
    }

    closeInfoDialog = () => {
        this.setState({ infoDialog: null });
    }

    getUsernamesInTable({skipId} = {}) {
        const { users } = this.state;
        const usernames = _(users.valueSeq().toJS())
            .map(user => user.id !== skipId ? user.username : null)
            .compact()
            .value();
        return new Set(usernames);
    }

    getInvalidUsernames() {
        return new Set(
            Array.from(this.state.existingUsernames).concat(Array.from(this.getUsernamesInTable()))
        );
    }

    getFieldsInfo() {
        const validators = {
            isRequired: {
                validator: Validators.isRequired,
                message: this.t(Validators.isRequired.message),
            },
            isValidEmail: {
                validator: Validators.isEmail,
                message: this.t(Validators.isEmail.message),
            },
            isUsernameNonExisting: toBuilderValidator(
                (username, userId) => validateUsername(
                    this.state.allowOverwrite ? new Set() : this.state.existingUsernames,
                    this.getUsernamesInTable({skipId: userId}),
                    username
                ),
                (username, error) => this.t(`username_${error}`, { username }),
            ),
            isValidPassword: toBuilderValidator(
                password => validatePassword(password),
                (password, error) => this.t(`password_${error}`),
            ),
        };

        return {
            username: { validators:[validators.isUsernameNonExisting] },
            password: { validators: [validators.isValidPassword] },
            email: { validators: [validators.isValidEmail] },
            _default: { validators: [] },
        };
    }

    getColumns() {
        const { columns } = this.props;
        const requiredColumns = ["username", "password"];

        return _(requiredColumns).difference(columns).concat(columns).value();
    }

    onTextFieldClicked = (userId, field) => {
        const { users, modelValuesByField } = this.state;
        const options = modelValuesByField[field];
        const user = this.getUser(userId);
        const selected = user[field].map(model => model.id);

        this.setState({
            multipleSelector: { user, field, selected, options },
        });
    }

    getTextField(name, value, { validators, component }) {
        return {
            name,
            value: value || "",
            component: component || TextField,
            props: { name, type: "string", style: { width: "100%" } },
            validators,
        };
    }

    getFields(user) {
        const relationshipFields = [
            "userRoles",
            "userGroups",
            "organisationUnits",
            "dataViewOrganisationUnits",
        ];

        return this.getColumns().map(field => {
            const value = user[field];
            const validators = (this.fieldsInfo[field] || this.fieldsInfo._default).validators;
            const isRelationship = relationshipFields.includes(field);

            if (isRelationship) {
                const compactValue = `[${value.length}] ` +
                    getCompactTextForModels(this.context.d2, value, { limit: 1 });
                const hoverText = _(value).map("displayName").join(", ");
                const onClick = this.getOnTextFieldClicked(user.id, field);

                return this.getTextField(field, compactValue, {
                    validators,
                    component: (props) =>
                        <TextField
                            {...props}
                            value={compactValue}
                            title={hoverText}
                            onClick={onClick}
                            onChange={onClick}
                        />,
                });
            } else {
                return this.getTextField(field, value, { component: TextField, validators });
            }
        });
    }

    addRow = () => {
        const { newUsername } = this.props;
        const { users } = this.state;
        const { usersValidation } = this;
        let newUser;

        if (newUsername) {
            const invalidUsernames = this.getInvalidUsernames();
            const index = _.range(1, 1000).find(i => !invalidUsernames.has(`${newUsername}_${i}`));
            newUser = {
                id: generateUid(),
                username: `${newUsername}_${index}`,
                password: `District123_${index}`,
            };
        } else {
            newUser = {
                id: generateUid(),
                username: "",
                password: `District123$`,
            };
        }

        this.setState({  users: users.set(newUser.id, newUser) });
        this.validateOnRender = true;
    }

    removeRow = (userId) => {
        const { users } = this.state;
        const { usersValidation } = this;

        this.setState({ users: users.remove(userId) });
        this.usersValidation = _(usersValidation).omit(userId).value();
        this.validateOnRender = true;
    }

    renderTableRow = ({ id: userId, children }) => {
        const { users, existingUsernames } = this.state;
        const user = this.getUser(userId);
        const index = users._map.get(userId);
        const rowStyles = existingUsernames.has(user.username) ? styles.rowExistingUser : styles.row;

        return (
            <TableRow style={rowStyles}>
                <TableRowColumn style={styles.tableColumn}>
                    <Chip>{index + 1}</Chip>
                </TableRowColumn>

                {children}

                <TableRowColumn style={styles.actionsHeader}>
                    <IconButton
                        style={styles.removeIcon}
                        tooltip={this.t('remove_user')}
                        tooltipPosition="bottom-left"
                        onClick={this.getRemoveRowHandler(userId)}
                    >
                        <FontIcon className="material-icons">delete</FontIcon>
                    </IconButton>
                </TableRowColumn>
            </TableRow>
        );
    }

    componentDidUpdate() {
        // After a render, unset validateOnRender to avoid infinite loops of FormBuilder render/validation
        this.validateOnRender = this.state.isLoading;
    }

    renderTable() {
        const { users } = this.state;
        const { maxUsers } = this.props;
        const canAddNewUser = users.size < maxUsers;
        const headers = this.getColumns().map(camelCaseToUnderscores);

        return (
            <div>
                <Table fixedHeader={true} style={{marginBottom: '30px'}}>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>
                            <TableHeaderColumn style={styles.tableColumn}>#</TableHeaderColumn>
                            {headers.map(header =>
                                <TableHeaderColumn key={header} style={styles.header}>
                                    {this.t(header)}
                                </TableHeaderColumn>
                            )}
                            <TableHeaderColumn style={styles.actionsHeader}></TableHeaderColumn>
                        </TableRow>
                    </TableHeader>

                    <TableBody displayRowCheckbox={false}>
                        {_.map(users.valueSeq().toJS(), user =>
                            <FormBuilder
                                key={"form-" + user.id}
                                id={user.id}
                                fields={this.getFields(user)}
                                onUpdateField={this.getOnUpdateField(user.id)}
                                onUpdateFormStatus={this.getOnUpdateFormStatus(user.id)}
                                validateOnRender={this.validateOnRender}
                                mainWrapper={this.renderTableRow}
                                fieldWrapper={TableRowColumn}
                            />
                        )}
                    </TableBody>
                </Table>

                <div style={styles.addRowButton}>
                    <RaisedButton
                        disabled={!canAddNewUser}
                        label={this.t('add_user')}
                        onClick={this.addRow}
                    />
                </div>
            </div>
        );
    }

    onSave = async () => {
        const { users } = this.state;
        const { onRequestClose, onSave } = this.props;

        const errorResponse = await onSave(users.valueSeq().toJS());
        if (errorResponse) {
            this.setState({ infoDialog: { response: errorResponse } });
        } else {
            onRequestClose();
        }
    }

    toggleAllowOverwrite = () => {
        this.setState({
            allowOverwrite: !this.state.allowOverwrite,
        });
        this.validateOnRender = true;
    }

    onMultipleSelectorClose = () => {
        this.setState({ multipleSelector: null });
    }

    onMultipleSelectorChange = (selectedIds, field, { user }) => {
        const { multipleSelector: { options } } = this.state;
        const selectedObjects = _(options).keyBy("id").at(selectedIds).compact().value();
        this.onUpdateField(user.id, field, selectedObjects);
        this.setState({ multipleSelector: null });
    }

    render() {
        const { onRequestClose, onSave, title } = this.props;
        const { infoDialog, users, isLoading, existingUsernames, allowOverwrite, areUsersValid } = this.state;
        const { multipleSelector, modelValuesByField, orgUnitRoots } = this.state;

        const duplicatedUsernamesExist = users.valueSeq().some(user => existingUsernames.has(user.username));
        const showProcessButton = !users.isEmpty() && areUsersValid;
        const actions = this.getActionsByState(allowOverwrite, duplicatedUsernamesExist, showProcessButton);

        return (
            <Dialog
                open={true}
                modal={true}
                title={title}
                actions={actions}
                autoScrollBodyContent={true}
                autoDetectWindowHeight={true}
                contentStyle={styles.dialog}
                bodyStyle={styles.dialogBody}
                onRequestClose={onRequestClose}
            >
                {isLoading ? <LoadingMask /> : this.renderTable()}

                {multipleSelector &&
                    <MultipleSelector
                        field={multipleSelector.field}
                        selected={multipleSelector.selected}
                        options={multipleSelector.options}
                        onClose={this.onMultipleSelectorClose}
                        onChange={this.onMultipleSelectorChange}
                        data={{user: multipleSelector.user}}
                        orgUnitRoots={orgUnitRoots}
                    />
                }

                {infoDialog &&
                    <InfoDialog
                        t={this.t}
                        title={this.t("metadata_error")}
                        onClose={this.closeInfoDialog}
                        response={infoDialog.response}
                    />
                }
            </Dialog>
        );
    }
}

ImportTable.contextTypes = {
    d2: PropTypes.object.isRequired,
};

ImportTable.propTypes = {
    title: PropTypes.string.isRequired,
    initialUsers: PropTypes.arrayOf(PropTypes.object),
    onSave: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    newUsername: PropTypes.string,
    maxUsers: PropTypes.number,
    actionText: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(PropTypes.string).isRequired,
    warnings: PropTypes.arrayOf(PropTypes.string),
};

ImportTable.defaultProps = {
    initialUsers: [],
    newUsername: null,
    maxUsers: null,
    warnings: [],
};

export default ImportTable;
