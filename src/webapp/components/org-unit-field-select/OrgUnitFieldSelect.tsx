import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import i18n from "../../../utils/i18n";
import { OrgUnitFieldPolicy } from "../../../domain/entities/AppSettings";

type OrgUnitFieldSelectProps<Value extends OrgUnitFieldPolicy> = {
    id: string;
    value: Value;
    options: readonly Value[];
    disabled?: boolean;
    onChange: (value: Value) => void;
};

function getLabel(policy: OrgUnitFieldPolicy): string {
    switch (policy) {
        case "userDefined":
            return i18n.t("User defined");
        case "shortName":
            return i18n.t("Short name");
        case "code":
            return i18n.t("Code");
    }
}

export function OrgUnitFieldSelect<Value extends OrgUnitFieldPolicy>(props: OrgUnitFieldSelectProps<Value>) {
    const { id, value, options, disabled, onChange } = props;
    const labelId = `${id}-label`;

    return (
        <FormControl fullWidth>
            <InputLabel id={labelId}>{i18n.t("Organisation Units Capture field")}</InputLabel>
            <Select
                labelId={labelId}
                value={value}
                disabled={disabled}
                onChange={event => onChange(event.target.value as Value)}
            >
                {options.map(option => (
                    <MenuItem key={option} value={option}>
                        {getLabel(option)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
