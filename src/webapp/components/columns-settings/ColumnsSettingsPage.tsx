import React from "react";
import styled from "styled-components";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    ButtonGroup,
    DialogActions,
    Typography,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import i18n from "../../../utils/i18n";
import {
    ColumnSettingValue,
    SettingsUserColumn,
    SettingsRoleColumn,
    SettingsDashboardColumn,
    SettingsGroupColumn,
} from "../../../domain/entities/AppSettings";

type ColumnConfig = SettingsUserColumn | SettingsRoleColumn | SettingsDashboardColumn | SettingsGroupColumn;

type ColumnsSettingsPageProps<T extends ColumnConfig> = {
    columns: T[];
    columnsMetadata: Array<{ name: string; text: string }>;
    onUpdateColumns: (columns: T[]) => void;
    onClose: () => void;
    onSave: () => void;
    showActions?: boolean;
    title: string;
    /* Extra settings of the section, rendered above the columns */
    children?: React.ReactNode;
};

export const ColumnsSettingsPage = <T extends ColumnConfig>(props: ColumnsSettingsPageProps<T>) => {
    const { children, columns, columnsMetadata, onClose, onSave, onUpdateColumns, showActions } = props;
    const updateColumns = (columnToUpdate: T, value: ColumnSettingValue) => {
        const newColumns = columns.map(column => {
            if (column.field === columnToUpdate.field) {
                return { ...column, value };
            }
            return column;
        }) as T[];
        onUpdateColumns(newColumns);
    };

    return (
        <ColumnsSettingsContainer>
            {showActions && (
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
            )}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">{props.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SectionColumnsContainer>
                        {children}
                        {columns.map(column => {
                            return (
                                <ColumnSelector
                                    key={column.field}
                                    column={column}
                                    onClick={updateColumns}
                                    columns={columns}
                                    columnsMetadata={columnsMetadata}
                                />
                            );
                        })}
                    </SectionColumnsContainer>
                </AccordionDetails>
            </Accordion>
        </ColumnsSettingsContainer>
    );
};

type ColumnSelectorProps<T extends ColumnConfig> = {
    columns: T[];
    columnsMetadata: Array<{ name: string; text: string }>;
    column: T;
    onClick: (columnToUpdate: T, value: ColumnSettingValue) => void;
};

export const ColumnSelector = <T extends ColumnConfig>(props: ColumnSelectorProps<T>) => {
    const { column, columns, columnsMetadata, onClick } = props;

    const buttonStates = React.useMemo((): Array<{ value: ColumnSettingValue; label: string }> => {
        return [
            { value: "disabled", label: i18n.t("Disable") },
            { value: "optional", label: i18n.t("Optional") },
            { value: "visible", label: i18n.t("Visible") },
            { value: "mandatory", label: i18n.t("Mandatory") },
        ];
    }, []);

    const isActive = (column: T, value: ColumnSettingValue) => {
        const currentValue = columns.find(c => c.field === column.field);

        if (value === "visible") return currentValue?.value === "visible";
        if (value === "disabled") return currentValue?.value === "disabled";
        if (value === "mandatory") return currentValue?.value === "mandatory";
        return currentValue === undefined || currentValue?.value === "optional";
    };

    const columnText = columnsMetadata.find(c => c.name === column.field)?.text;

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
};

const ColumnsSettingsContainer = styled.section`
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

const SectionColumnsContainer = styled.div`
    padding-inline: 1em;
`;
