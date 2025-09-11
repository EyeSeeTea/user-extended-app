import React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, DialogActions, Typography } from "@material-ui/core";

import { useUserColumns } from "../user-list-table/UserListTable";
import i18n from "../../../utils/i18n";
import { AppSettings, ColumnSettingValue, SettingsUserColumn } from "../../../domain/entities/AppSettings";
import { Maybe } from "../../../types/utils";

type ColumnsSettingsPageProps = {
    appSettings: Maybe<AppSettings>;
    onUpdateColumns: (columns: SettingsUserColumn[]) => void;
    onClose: () => void;
    onSave: () => void;
};

export const ColumnsSettingsPage = React.memo((props: ColumnsSettingsPageProps) => {
    const { appSettings, onClose, onSave, onUpdateColumns } = props;

    const updateColumns = (columnToUpdate: SettingsUserColumn, value: ColumnSettingValue) => {
        const newColumns = appSettings?.updateColumnField(columnToUpdate.field, value) || [];
        onUpdateColumns(newColumns);
    };

    return (
        <ColumnsSettingsContainer>
            <div className="sticky-actions">
                <DialogActions>
                    <Button variant="contained" color="primary" onClick={onSave}>
                        {i18n.t("Save")}
                    </Button>
                    <Button color="secondary" onClick={onClose}>
                        {i18n.t("Close")}
                    </Button>
                </DialogActions>
            </div>
            {appSettings?.columns.map(column => {
                return (
                    <ColumnSelector key={column.field} column={column} onClick={updateColumns} settings={appSettings} />
                );
            })}
        </ColumnsSettingsContainer>
    );
});

type ColumnSelectorProps = {
    settings: Maybe<AppSettings>;
    column: SettingsUserColumn;
    onClick: (columnToUpdate: SettingsUserColumn, value: ColumnSettingValue) => void;
};

export const ColumnSelector = React.memo((props: ColumnSelectorProps) => {
    const { column, settings, onClick } = props;
    const userColumns = useUserColumns();

    const buttonStates = React.useMemo((): Array<{ value: ColumnSettingValue; label: string }> => {
        return [
            { value: "visible", label: i18n.t("Visible") },
            { value: "optional", label: i18n.t("Optional") },
            { value: "disabled", label: i18n.t("Disable") },
        ];
    }, []);

    const isActive = (column: SettingsUserColumn, value: ColumnSettingValue) => {
        const currentValue = settings?.columns.find(c => c.field === column.field);

        if (value === "visible") return currentValue?.value === "visible";
        if (value === "disabled") return currentValue?.value === "disabled";
        return currentValue === undefined || currentValue?.value === "optional";
    };

    const columnText = userColumns.find(c => c.name === column.field)?.text;

    return (
        <Container key={column.field}>
            <Typography variant="body1" className="label">
                {columnText}
            </Typography>
            <ButtonGroup>
                {buttonStates.map(({ value, label }) => (
                    <Button
                        key={value}
                        variant={isActive(column, value) ? "contained" : "outlined"}
                        color={isActive(column, value) ? "primary" : "default"}
                        onClick={() => onClick(column, value)}
                    >
                        {label}
                    </Button>
                ))}
            </ButtonGroup>
        </Container>
    );
});

const ColumnsSettingsContainer = styled.section`
    padding: 2em;
    position: relative;
`;

const Container = styled.div`
    align-items: center;
    display: flex;
    padding-block: 0.5em;

    .label {
        flex: 0 0 30%;
    }
`;
