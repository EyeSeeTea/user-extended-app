import React from "react";
import { IconButton, Tooltip, Menu, MenuItem, Button } from "@material-ui/core";
import ImportExportIcon from "@material-ui/icons/ImportExport";

type PopoverListProps = {
    title: string;
    items: Array<{ id: string; label: string; icon: React.ReactElement }>;
    onItemClick: (id: string) => void;
};

export const PopoverList: React.FC<PopoverListProps> = props => {
    const { onItemClick, title, items } = props;
    const [isMenuOpen, setMenuOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const openMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuOpen(true);
        setAnchorEl(event.currentTarget);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <div>
            <Tooltip title={title}>
                <IconButton onClick={openMenu}>
                    <ImportExportIcon />
                </IconButton>
            </Tooltip>

            <Menu
                open={isMenuOpen}
                getContentAnchorEl={null}
                anchorEl={anchorEl}
                onClose={closeMenu}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
            >
                {items.map(item => {
                    return (
                        <MenuItem
                            key={item.id}
                            onClick={() => {
                                onItemClick(item.id);
                                closeMenu();
                            }}
                        >
                            <Button startIcon={item.icon}>{item.label}</Button>
                        </MenuItem>
                    );
                })}
            </Menu>
        </div>
    );
};

const anchorOrigin = {
    vertical: "bottom",
    horizontal: "center",
} as const;
const transformOrigin = {
    vertical: "top",
    horizontal: "center",
} as const;
