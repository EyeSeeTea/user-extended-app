import React from "react";
import { Box, Typography, useTheme } from "@material-ui/core";
import { DropdownItem, MultipleDropdown } from "@eyeseetea/d2-ui-components";
import { UserAction, userActions } from "../../../domain/entities/UserAction";
import { ActionsPermissions } from "../../../domain/entities/AppSettings";
import { useSharingActions, Value } from "./useSharingActions";
import { getUserActionLabel } from "../user-list-table/userListTableHelpers";
import i18n from "../../../utils/i18n";

export type SharingActionsProps = {
    actionsPermissions: ActionsPermissions;
    setActionsPermissions: React.Dispatch<React.SetStateAction<ActionsPermissions>>;
};

export const SharingActions: React.FC<SharingActionsProps> = React.memo(props => {
    const theme = useTheme();

    const { items, selectedValues, setSelectedValues } = useSharingActions(props);

    const sharingActionProps: SharingActionProps[] = React.useMemo(
        () =>
            userActions.map(action => ({
                action,
                items,
                values: selectedValues[action],
                onChange: setSelectedValues(action),
            })),
        [items, setSelectedValues, selectedValues]
    );

    return (
        <Box
            display="flex"
            flexDirection="column"
            flexWrap="wrap"
            marginY={2}
            paddingX={theme.spacing(0.25)}
            gridRowGap={theme.spacing(2)}
        >
            {sharingActionProps.map(props => (
                <SharingAction key={props.action} {...props} />
            ))}
        </Box>
    );
});

type SharingActionProps = {
    action: UserAction;
    items: DropdownItem[];
    values: Value[];
    onChange: (values: Value[]) => void;
};

const SharingAction: React.FC<SharingActionProps> = props => {
    const { action, items, values, onChange } = props;

    return (
        <Box display="grid" key={action} gridTemplateColumns="1fr 3fr" alignItems="center">
            <Typography variant="body2">{getUserActionLabel(action)}</Typography>
            <MultipleDropdown
                key={action}
                items={items}
                onChange={onChange}
                label={i18n.t("Select user groups and rules")}
                values={values}
            />
        </Box>
    );
};
