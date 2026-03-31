import { render, RenderResult } from "@testing-library/react";
import { SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { ReactNode } from "react";
import { getCompositionRoot } from "../CompositionRoot";
import { getMockApi } from "../types/d2-api";
import { AppContext, AppContextState } from "../webapp/contexts/app-context";
import { Instance } from "../data/entities/Instance";
import { UserProps } from "../domain/entities/UserProps";

export function getTestUser(): UserProps {
    return {
        id: "xE7jOejl9FI",
        name: "John Traore",
        username: "admin",
        userGroups: [],
        userRoles: [],
        organisationUnits: [],
        dataViewOrganisationUnits: [],
        searchOrganisationsUnits: [],
        firstName: "John",
        surname: "Traore",
        email: "john.traore@example.com",
        phoneNumber: "",
        whatsApp: "",
        facebookMessenger: "",
        skype: "",
        telegram: "",
        twitter: "",
        lastUpdated: new Date("2020-01-01T12:00:00.000"),
        created: new Date("2020-01-01T12:00:00.000"),
        apiUrl: "http://localhost:8080/api",
        lastLogin: new Date("2020-01-01T12:00:00.000"),
        status: "ACTIVE",
        disabled: false,
        access: {
            manage: true,
            externalize: true,
            write: true,
            delete: true,
            read: true,
            update: true,
        },
        openId: null,
        ldapId: null,
        externalAuth: false,
        twoFactorEnabled: false,
        password: "",
        accountExpiry: null,
        authorities: ["ALL"],
        createdBy: null,
        lastModifiedBy: null,
        uiLocale: "en",
        dbLocale: "en",
    };
}

export function getTestConfig() {
    return {};
}

export function getTestD2() {
    return {};
}

export function getTestContext() {
    // Mock api was working with axios but not with fetch
    const { api } = getMockApi();
    const instance = new Instance({ url: "http://localhost:8080" });
    const context = {
        api: api,
        d2: getTestD2(),
        currentUser: getTestUser(),
        config: getTestConfig(),
        compositionRoot: getCompositionRoot(instance, "dataStore"),
    };

    return { api, context };
}

export function getReactComponent(children: ReactNode, context: AppContextState): RenderResult {
    return render(
        <AppContext.Provider value={context}>
            <SnackbarProvider>{children}</SnackbarProvider>
        </AppContext.Provider>
    );
}
