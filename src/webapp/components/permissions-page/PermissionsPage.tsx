import React from "react";
import { Box, Button, DialogActions, FormControlLabel, Switch, useTheme } from "@material-ui/core";

import { AppSettings } from "../../../domain/entities/AppSettings";
import i18n from "../../../locales";

type PermissionsPageProps = { appSettings: AppSettings; onSave: (appSettings: AppSettings) => void };

export const PermissionsPage = React.memo((props: PermissionsPageProps) => {
    const { appSettings, onSave } = props;

    const theme = useTheme();

    const [formState, setForm] = React.useState<FormType>({
        activeUsers: appSettings.showOnlyActiveUsers,
        usersOrgUnits: appSettings.showOnlyUsersOrgUnits,
        feedbackButton: appSettings.showFeedback,
    });

    const updateFormState = (value: boolean, field: keyof FormType) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const onSaveSettings = React.useCallback(() => {
        onSave(
            AppSettings.create({
                ...appSettings,
                showOnlyActiveUsers: formState.activeUsers,
                showOnlyUsersOrgUnits: formState.usersOrgUnits,
                showFeedback: formState.feedbackButton,
            })
        );
    }, [formState, appSettings, onSave]);

    return (
        <Box component="section" padding={theme.spacing(0.25)}>
            <Box display="flex" flexDirection="column" flexWrap="wrap" paddingX={theme.spacing(0.25)}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.feedbackButton}
                            onChange={event => updateFormState(event.target.checked, "feedbackButton")}
                        />
                    }
                    label={i18n.t("Show feedback button")}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.usersOrgUnits}
                            onChange={event => updateFormState(event.target.checked, "usersOrgUnits")}
                        />
                    }
                    label={i18n.t("Show only users assigned to users' organisation units")}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={formState.activeUsers}
                            onChange={event => updateFormState(event.target.checked, "activeUsers")}
                        />
                    }
                    label={i18n.t("Show only active users")}
                />
            </Box>

            <DialogActions>
                <Button onClick={onSaveSettings} color="primary" variant="contained">
                    {i18n.t("Save")}
                </Button>
            </DialogActions>
        </Box>
    );
});

type FormType = { activeUsers: boolean; usersOrgUnits: boolean; feedbackButton: boolean };
