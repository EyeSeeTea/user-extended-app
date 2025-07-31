import React from "react";
import { Paper, Tab, Tabs } from "@material-ui/core";
import { useLocation, useNavigate } from "react-router-dom";
import { Maybe } from "../../../types/utils";
import i18n from "./../../../locales";

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

export const TabsMenu = React.memo((props: { children: React.ReactNode }) => {
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
            </Tabs>
            <Paper elevation={5} className="tab-content">
                {props.children}
            </Paper>
        </>
    );
});
