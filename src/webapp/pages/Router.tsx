import React from "react";
import styled from "styled-components";
import { HashRouter, Route, Routes } from "react-router-dom";
import { LegacyAppWrapper } from "../../legacy/LegacyApp";
import { ListHybrid } from "../../legacy/List/List.component";
import { useAppContext } from "../contexts/app-context";
import { UserBulkEditPage } from "./user-bulk-edit/UserBulkEditPage";
import { UserEditPage } from "./user-edit/UserEditPage";
import { About } from "../components/about/About";
import { AboutPage } from "./about/AboutPage";
import { DashboardTable } from "../components/dashboard/DashboardTable";
import { UserRoleTable } from "../components/user-role/UserRoleTable";
import { UserGroupTable } from "../components/user-group-table/UserGroupTable";
import { TabsMenu } from "../components/tabs-menu/TabsMenu";
import { IconButton, Tooltip } from "@material-ui/core";
import BuildIcon from "@material-ui/icons/Build";
import i18n from "../../utils/i18n";
import { useAppSettingsContext } from "../contexts/AppSettingsProvider";
import { SettingsDialogModal } from "../components/settings-dialog-modal/SettingsDialogModal";

const TabWrapper = ({ children }: { children: React.ReactNode }) => (
    <LegacyAppWrapper>
        <TabsMenu>{children}</TabsMenu>
    </LegacyAppWrapper>
);

export const Router: React.FC = React.memo(() => {
    const { api, currentUser, compositionRoot, d2 } = useAppContext();
    const [currentUserHasAccessToSettings, setCurrentUserHasAccessToSettings] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);
    const { appSettings, setAppSettings } = useAppSettingsContext();

    React.useEffect(() => {
        compositionRoot.users.checkCurrentUserCanAccessSettings().run(setCurrentUserHasAccessToSettings, console.error);
    }, [compositionRoot.users]);

    const updateAppSettings = React.useCallback(
        newAppSettings => {
            setAppSettings(newAppSettings);
            setShowSettings(false);
        },
        [setAppSettings]
    );

    return (
        <HashRouter>
            <Routes>
                <Route path="/bulk-edit" element={<UserBulkEditPage isEdit={true} />} />
                <Route path="/edit/:id" element={<UserEditPage type="edit" />} />
                <Route path="/new" element={<UserEditPage type="new" />} />
                <Route path="/about" element={<AboutPage />} />

                <Route
                    path="/"
                    element={
                        <TabWrapper>
                            <ListHybrid api={api} params={{ modelType: "users", currentUser }} />
                        </TabWrapper>
                    }
                />

                <Route
                    path="/dashboards"
                    element={
                        <TabWrapper>
                            <DashboardTable />
                        </TabWrapper>
                    }
                />

                <Route
                    path="/user-roles"
                    element={
                        <TabWrapper>
                            <UserRoleTable appSettings={appSettings} />
                        </TabWrapper>
                    }
                />

                <Route
                    path="/user-groups"
                    element={
                        <TabWrapper>
                            <UserGroupTable />
                        </TabWrapper>
                    }
                />
            </Routes>
            <IconsContainer>
                <About icon="about" visible={true} />
            </IconsContainer>

            {showSettings && currentUserHasAccessToSettings && (
                <SettingsDialogModal
                    d2={d2}
                    onClose={() => setShowSettings(false)}
                    onCloseAppSettings={updateAppSettings}
                />
            )}

            {currentUserHasAccessToSettings && (
                <div className="user-settings-button">
                    <Tooltip title={i18n.t("Settings")}>
                        <IconButton
                            style={{ marginInlineStart: "auto" }}
                            onClick={() => setShowSettings(true)}
                            aria-label={i18n.t("Settings")}
                        >
                            <BuildIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            )}
        </HashRouter>
    );
});

const IconsContainer = styled.div`
    align-items: center;
    inset-block-end: -3px;
    display: flex;
    gap: 1em;
    justify-content: center;
    position: fixed;
    inset-inline-end: 80px;
`;
