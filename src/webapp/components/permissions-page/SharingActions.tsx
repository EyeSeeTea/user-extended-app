import React from "react";
import { Box, Typography, useTheme } from "@material-ui/core";
import { OfflinePinOutlined as OfflinePinOutlinedIcon } from "@material-ui/icons";
import { DropdownItem, MultipleDropdown } from "@eyeseetea/d2-ui-components";
import { UserAction } from "../../../domain/entities/UserAction";
import { ActionsPermissions } from "../../../domain/entities/AppSettings";
import { useSharingActions, Value } from "./useSharingActions";
import { getUserActionLabel } from "../user-list-table/userListTableHelpers";
import i18n from "../../../utils/i18n";
import { Maybe } from "../../../types/utils";

export type SharingActionsProps = {
    actionsPermissions: ActionsPermissions;
    setActionsPermissions: React.Dispatch<React.SetStateAction<ActionsPermissions>>;
};

export const SharingActions: React.FC<SharingActionsProps> = React.memo(props => {
    const theme = useTheme();

    const sharingActionProps = useSharingActions(props);

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

export type SharingActionProps = {
    action: UserAction;
    items: DropdownItem[];
    values: Value[];
    onChange: (values: Value[]) => void;
    info: Maybe<string>;
};

const SharingAction: React.FC<SharingActionProps> = props => {
    const { action, items, values, onChange, info } = props;

    const theme = useTheme();

    return (
        <Box display="grid" key={action} gridTemplateColumns="1fr 3fr" alignItems="center">
            <Box display="flex" alignItems="center" gridColumnGap={theme.spacing(0.75)}>
                <Typography variant="body2">{getUserActionLabel(action)}</Typography>
                {info && <OfflinePinOutlinedIcon fontSize="small" color="primary" titleAccess={info} />}
            </Box>
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
