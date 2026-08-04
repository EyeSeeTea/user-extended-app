import React from "react";
import styled from "styled-components";
import { Tooltip } from "@material-ui/core";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../utils/i18n";
import Settings from "../../../legacy/models/settings";
import { OrgUnitField, orgUnitFields } from "../../../domain/entities/AppSettings";
import { Maybe } from "../../../types/utils";
import { OrgUnitFieldSelect } from "../org-unit-field-select/OrgUnitFieldSelect";

type OrgUnitFieldUserSettingProps = {
    settings: Settings;
    configuredValue: Maybe<OrgUnitField>;
    onSaved: (settings: Settings) => void;
};

export const OrgUnitFieldUserSetting: React.FC<OrgUnitFieldUserSettingProps> = React.memo(props => {
    const { settings, configuredValue, onSaved } = props;
    const snackbar = useSnackbar();
    const [value, setValue] = React.useState<OrgUnitField>(() => settings.get("organisationUnitsField"));

    const onChange = React.useCallback(
        (newValue: OrgUnitField) => {
            setValue(newValue);
            settings
                .set({ organisationUnitsField: newValue })
                .save()
                .then((savedSettings: Settings) => {
                    onSaved(savedSettings);
                    snackbar.success(i18n.t("Import settings saved"));
                })
                .catch((error: unknown) => snackbar.error(String(error)));
        },
        [onSaved, settings, snackbar]
    );

    const select = (
        <OrgUnitFieldSelect
            id="user-org-units-field"
            value={configuredValue ?? value}
            options={orgUnitFields}
            disabled={Boolean(configuredValue)}
            onChange={onChange}
        />
    );

    return (
        <Container>
            {configuredValue ? (
                <Tooltip title={i18n.t("An administrator has set this value for all users")} placement="top" arrow>
                    <span>{select}</span>
                </Tooltip>
            ) : (
                select
            )}
        </Container>
    );
});

const Container = styled.div`
    margin-top: 1em;
`;
