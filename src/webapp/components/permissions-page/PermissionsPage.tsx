import React from "react";
import styled from "styled-components";
import { Button, DialogActions, FormControlLabel, Switch } from "@material-ui/core";

import { AppSettings } from "../../../domain/entities/AppSettings";
import { Maybe } from "../../../types/utils";
import i18n from "../../../locales";

type PermissionsPageProps = { appSettings: Maybe<AppSettings>; onSave: (appSettings: AppSettings) => void };

export const PermissionsPage = React.memo((props: PermissionsPageProps) => {
    const { appSettings, onSave } = props;
    const [formState, setForm] = React.useState<FormType>({ activeUsers: appSettings?.showOnlyActiveUsers ?? false });

    const updateActiveUsers = (value: boolean, field: keyof FormType) => {
        setForm(prev => {
            return { ...prev, [field]: value };
        });
    };

    const onSaveSettings = React.useCallback(() => {
        if (!appSettings) return;
        onSave(
            AppSettings.create({
                ...appSettings,
                showOnlyActiveUsers: formState.activeUsers,
            })
        );
    }, [formState, appSettings, onSave]);

    if (!appSettings) return null;

    return (
        <PermissionsContainer>
            <FormControlLabel
                control={
                    <Switch
                        checked={formState.activeUsers}
                        onChange={event => updateActiveUsers(event.target.checked, "activeUsers")}
                    />
                }
                label={i18n.t("Show only active users")}
            />

            <DialogActions>
                <Button onClick={onSaveSettings} color="primary" variant="contained">
                    {i18n.t("Save")}
                </Button>
            </DialogActions>
        </PermissionsContainer>
    );
});

type FormType = { activeUsers: boolean };

const PermissionsContainer = styled.section`
    padding: 1em;
`;
