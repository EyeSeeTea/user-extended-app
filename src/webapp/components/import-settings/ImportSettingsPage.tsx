import React from "react";
import styled from "styled-components";
import { Button, DialogActions } from "@material-ui/core";
import i18n from "../../../utils/i18n";
import { OrgUnitFieldPolicy, orgUnitFieldPolicies } from "../../../domain/entities/AppSettings";
import { OrgUnitFieldSelect } from "../org-unit-field-select/OrgUnitFieldSelect";

type ImportSettingsPageProps = {
    value: OrgUnitFieldPolicy;
    onUpdate: (value: OrgUnitFieldPolicy) => void;
    onClose: () => void;
    onSave: () => void;
};

export const ImportSettingsPage: React.FC<ImportSettingsPageProps> = React.memo(props => {
    const { value, onUpdate, onClose, onSave } = props;

    return (
        <Container>
            <OrgUnitFieldSelect
                id="organisation-units-field"
                value={value}
                options={orgUnitFieldPolicies}
                onChange={onUpdate}
            />

            <DialogActions>
                <Button variant="contained" color="primary" onClick={onSave}>
                    {i18n.t("Save")}
                </Button>
                <Button onClick={onClose}>{i18n.t("Close")}</Button>
            </DialogActions>
        </Container>
    );
});

const Container = styled.div`
    padding: 2em;
`;
