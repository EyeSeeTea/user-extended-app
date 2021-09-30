import _ from "lodash";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import TextField from "material-ui/TextField";
import PropTypes from "prop-types";
import React from "react";
import { getOrgUnitsRoots } from "../utils/dhis2Helpers";
import OrgUnitForm from "./OrgUnitForm";

class OrgUnitsFilter extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.getTranslation = context.d2.i18n.getTranslation.bind(context.d2.i18n);
        this.openDialog = this.openDialog.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.onChange = this.onChange.bind(this);
        this.applyAndClose = this.applyAndClose.bind(this);
        this.fieldValue = this.getCompactFieldValue(props.selected);
        this.state = {
            dialogOpen: false,
            selected: props.selected,
            roots: [],
        };
    }

    styles = {
        dialog: {
            minWidth: 875,
            maxWidth: "100%",
        },
        cancelButton: {
            marginRight: 16,
        },
        wrapper: {
            width: "inherit",
            position: "relative",
        },
        inputStyle: {
            cursor: "pointer",
        },
    };

    componentDidMount = () => {
        return getOrgUnitsRoots().then(roots => this.setState({ roots }));
    };

    componentWillReceiveProps(newProps) {
        if (newProps.selected !== this.props.selected) this.fieldValue = this.getCompactFieldValue(newProps.selected);
    }

    openDialog = () => {
        this.setState({ dialogOpen: true, selected: this.props.selected });
    };

    closeDialog = () => {
        this.setState({ dialogOpen: false });
    };

    onChange(selected) {
        this.setState({ selected });
    }

    applyAndClose = () => {
        this.props.onChange(this.state.selected);
        this.closeDialog();
    };

    getDialogButtons = () => {
        return (
            <React.Fragment>
                <FlatButton
                    label={this.getTranslation("cancel")}
                    onClick={this.closeDialog}
                    style={this.styles.cancelButton}
                />
                ,
                <RaisedButton primary label={this.getTranslation("apply")} onClick={this.applyAndClose} />,
            </React.Fragment>
        );
    };

    getCompactFieldValue(selected, { limit = 3 } = {}) {
        const names = selected.map(ou => ou.displayName);

        if (names.length <= limit) {
            return names.join(", ");
        } else {
            return this.getTranslation("this_and_n_others_compact", {
                this: _(names).take(limit).join(", "),
                n: names.length - limit,
            });
        }
    }

    render = () => {
        const { title, styles } = this.props;
        const { dialogOpen } = this.state;
        const t = this.getTranslation.bind(this);

        return (
            <div style={this.styles.wrapper}>
                <Dialog
                    title={title}
                    actions={this.getDialogButtons()}
                    autoScrollBodyContent={true}
                    autoDetectWindowHeight={true}
                    contentStyle={this.styles.dialog}
                    open={dialogOpen}
                    onRequestClose={this.closeDialog}
                >
                    <OrgUnitForm
                        onRequestClose={this.closeDialog}
                        onChange={this.onChange}
                        roots={this.state.roots}
                        selected={this.state.selected}
                        intersectionPolicy={true}
                        filteringByNameLabel={
                            title.includes("organisation units capture")
                                ? t("filter_organisation_units_capture_by_name")
                                : t("filter_organisation_units_output_by_name")
                        }
                        orgUnitsSelectedLabel={
                            title.includes("organisation units capture")
                                ? t("organisation_units_capture_selected")
                                : t("organisation_units_output_selected")
                        }
                    />
                </Dialog>

                <TextField
                    value={this.fieldValue}
                    onClick={this.openDialog}
                    onChange={this.openDialog}
                    floatingLabelText={title}
                    style={styles.textField}
                    inputStyle={this.styles.inputStyle}
                />
            </div>
        );
    };
}

OrgUnitsFilter.propTypes = {
    title: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    selected: PropTypes.arrayOf(PropTypes.object).isRequired,
    styles: PropTypes.object,
};

OrgUnitsFilter.contextTypes = {
    d2: PropTypes.any,
};

export default OrgUnitsFilter;
