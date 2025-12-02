import React from "react";
import { IconButton, Paper, Tab, Tabs, Tooltip } from "@material-ui/core";
import BuildIcon from "@material-ui/icons/Build";
import { useLocation, useNavigate } from "react-router-dom";
import { Maybe } from "../../../types/utils";
import i18n from "./../../../utils/i18n";

function getTabsValues() {
    return [
        {
            value: "/",
            label: i18n.t("Users"),
        },
        {
            value: "/user-groups",
            label: i18n.t("User Groups"),
        },
        {
            value: "/user-roles",
            label: i18n.t("User Roles"),
        },
        {
            value: "/dashboards",
            label: i18n.t("Dashboards"),
        },
    ] as const;
}

type TabType = ReturnType<typeof getTabsValues>[number]["value"];

function convertToTabType(value: Maybe<string>): TabType {
    const currentTab = getTabsValues().find(tab => tab.value === value);
    return currentTab?.value || "/";
}

export const TabsMenu = React.memo(
    (props: { children: React.ReactNode; onClickSettings: () => void; showSettings: boolean }) => {
        const { onClickSettings, showSettings } = props;
        const location = useLocation();
        const navigate = useNavigate();

        const allTabs = getTabsValues();
        const [currentTab, setCurrentTab] = React.useState<TabType>(convertToTabType(location.pathname));

        const handleChange = (_event: React.ChangeEvent<{}>, newValue: TabType) => {
            setCurrentTab(newValue);
            navigate(newValue);
        };

        return (
            <>
                <Tabs value={currentTab} onChange={handleChange}>
                    {allTabs.map(tab => (
                        <Tab key={tab.value} value={tab.value} label={tab.label} />
                    ))}
                    {showSettings && (
                        <Tooltip title={i18n.t("Settings")}>
                            <IconButton
                                style={{ marginInlineStart: "auto" }}
                                onClick={onClickSettings}
                                aria-label={i18n.t("Settings")}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Tabs>
                <Paper elevation={5} className="tab-content">
                    {props.children}
                </Paper>
            </>
        );
    }
);
