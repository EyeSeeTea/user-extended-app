import React from "react";
import i18n from "../../../utils/i18n";
import { IconButton, Menu, MenuItem } from "material-ui";
import { Popover } from "@material-ui/core";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import ImportIcon from "@material-ui/icons/ArrowUpward";
import ExportIcon from "@material-ui/icons/ArrowDownward";
import fileDialog from "file-dialog";
import { importFromCsv, importFromJson } from "../../../legacy/models/userHelpers";
import { useAppContext } from "../../contexts/app-context";
import { useSnackbar, useLoading } from "@eyeseetea/d2-ui-components";
import { ColumnMappingKeys } from "../../../domain/usecases/ExportUsersUseCase";
import { useExportUsers } from "../../hooks/userHooks";
import Settings from "../../../legacy/models/settings";
import { isSuperAdmin, UserProps } from "../../../domain/entities/UserProps";
import { Columns } from "./ImportTable";
import { ImportUser } from "../../../domain/entities/ImportUser";
import { ListOptions } from "../../../domain/repositories/UserRepository";
import { AppSettings } from "../../../domain/entities/AppSettings";

export const ImportExport: React.FC<ImportExportProps> = props => {
    const { d2, currentUser } = useAppContext();
    const { appSettings, columns, filterOptions, onImport, settings } = props;
    const { uiUserActionsAccess } = appSettings;
    const snackbar = useSnackbar();
    const loading = useLoading();
    const [isMenuOpen, setMenuOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const isAdmin = isSuperAdmin(currentUser);

    const openMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuOpen(true);
        setAnchorEl(event.currentTarget);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const orgUnitsField = settings.get("organisationUnitsField");
    const { exportUsersToCSV, exportUsersToJSON, exportEmptyTemplate } = useExportUsers({
        columns,
        filterOptions,
        orgUnitsField,
        onSuccess: closeMenu,
    });

    const importFromFile = () => {
        fileDialog({ accept: ["text/csv", "application/json"] })
            .then((files: FileList) => {
                loading.show(true);
                const file = files[0];
                if (!file) return;
                if (file.type === "text/csv") {
                    return importFromCsv(d2, file, { maxUsers: ImportUser.MAX_USERS, orgUnitsField });
                } else if (file.type === "application/json") {
                    return importFromJson(d2, file, { maxUsers: ImportUser.MAX_USERS, orgUnitsField });
                }
            })
            .then(result => {
                loading.hide();
                closeMenu();
                onImport(result);
            })
            .catch(err => {
                snackbar.error(err.toString());
                loading.hide();
                closeMenu();
            });
    };

    return (
        <div className="data-table-import-export">
            <IconButton onClick={openMenu} tooltipPosition="bottom-left" tooltip={i18n.t("Import/Export")}>
                <ImportExportIcon />
            </IconButton>

            <Popover
                open={isMenuOpen}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: "center",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                onClose={closeMenu}
            >
                <Menu>
                    {(isAdmin || uiUserActionsAccess.import.visible) && (
                        <MenuItem leftIcon={<ImportIcon />} onClick={importFromFile}>
                            {i18n.t("Import")}
                        </MenuItem>
                    )}
                    {(isAdmin || uiUserActionsAccess.exportCsv.visible) && (
                        <MenuItem leftIcon={<ExportIcon />} onClick={exportUsersToCSV}>
                            {i18n.t("Export to CSV")}
                        </MenuItem>
                    )}
                    {(isAdmin || uiUserActionsAccess.exportJson.visible) && (
                        <MenuItem leftIcon={<ExportIcon />} onClick={exportUsersToJSON}>
                            {i18n.t("Export to JSON")}
                        </MenuItem>
                    )}

                    <MenuItem leftIcon={<ExportIcon />} onClick={exportEmptyTemplate}>
                        {i18n.t("Export empty template")}
                    </MenuItem>
                </Menu>
            </Popover>
        </div>
    );
};

export type ImportExportProps = {
    columns: ColumnMappingKeys[];
    filterOptions: ListOptions;
    onImport: (result: ImportResult) => void;
    settings: Settings;
    appSettings: AppSettings;
};

export type ImportResult = { columns: Columns[]; users: UserProps[]; success: boolean; warnings: string[] };
