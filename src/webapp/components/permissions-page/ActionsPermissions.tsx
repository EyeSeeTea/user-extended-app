import React from "react";
import { Box, Typography, useTheme } from "@material-ui/core";
import { getUserActioni18nKeyLabel, UserAction, userActions } from "../../../domain/entities/UserAction";
import { Permission } from "../../../domain/entities/Permission";
import { MultipleDropdown } from "@eyeseetea/d2-ui-components";
import i18n from "../../../locales";

type ActionsPermissionsProps = {
    actionsAccess: Record<UserAction, Permission>;
    setActionsAccess: (actionsAccess: Record<UserAction, Permission>) => void;
};

export const ActionsPermissions = React.memo((props: ActionsPermissionsProps) => {
    const { actionsAccess, setActionsAccess } = props;

    const theme = useTheme();

    return (
        <Box
            display="flex"
            flexDirection="column"
            flexWrap="wrap"
            marginY={2}
            paddingX={theme.spacing(0.25)}
            gridRowGap={theme.spacing(0.25)}
        >
            {userActions.map(action => (
                <ActionDropdown key={action} action={action} />
            ))}
        </Box>
    );
});

type ActionDropdownProps = {
    action: UserAction;
};

const ActionDropdown: React.FC<ActionDropdownProps> = ({ action }) => {
    return (
        <Box display="grid" key={action} gridTemplateColumns="1fr 3fr" alignItems="center">
            <Typography variant="body2">{i18n.t(getUserActioni18nKeyLabel(action))}</Typography>
            <MultipleDropdown
                key={action}
                items={[]}
                onChange={() => {}}
                label={i18n.t("Select user groups")}
                values={[]}
            />
        </Box>
    );
};
