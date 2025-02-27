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

const TabWrapper = ({ children }: { children: React.ReactNode }) => (
    <LegacyAppWrapper>
        <TabsMenu>{children}</TabsMenu>
    </LegacyAppWrapper>
);

export const Router: React.FC = React.memo(() => {
    const { api } = useAppContext();

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
                            <ListHybrid api={api} params={{ modelType: "users" }} />
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
                            <UserRoleTable />
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
        </HashRouter>
    );
});

const IconsContainer = styled.div`
    align-items: center;
    bottom: -3px;
    display: flex;
    gap: 1em;
    justify-content: center;
    position: fixed;
    right: 80px;
`;
