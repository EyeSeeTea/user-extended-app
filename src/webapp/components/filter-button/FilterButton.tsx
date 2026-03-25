import React from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import FilterIcon from "@material-ui/icons/FilterList";

import i18n from "../../../utils/i18n";

type FilterButtonProps = {
    tooltipLabel: string;
    onClick: () => void;
    buttonLabel?: string;
    buttonActive?: boolean;
};

export const FilterButton = React.memo((props: FilterButtonProps) => {
    const { tooltipLabel, onClick, buttonLabel, buttonActive } = props;

    const filterLabel = i18n.t("Filters");

    return (
        <Tooltip title={tooltipLabel}>
            <IconButton
                color={buttonActive ? "secondary" : "default"}
                aria-label={buttonLabel ? buttonLabel : filterLabel}
                onClick={onClick}
            >
                <FilterIcon />
            </IconButton>
        </Tooltip>
    );
});
