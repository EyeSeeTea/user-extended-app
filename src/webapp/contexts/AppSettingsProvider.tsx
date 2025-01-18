import React, { createContext, useContext } from "react";
import { AppSettings } from "../../domain/entities/AppSettings";
import { useAppSettings } from "../hooks/useAppSettings";

interface AppSettingsContextState {
    appSettings: AppSettings;
    save: (settings: AppSettings, onSuccess: () => void, onError: (message: string) => void) => void;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const AppSettingsContext = createContext<AppSettingsContextState | null>(null);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const appSettingsWrapper = useAppSettings();

    if (appSettingsWrapper.hasLoaded === false) return null;

    return <AppSettingsContext.Provider value={appSettingsWrapper}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettingsContext = () => {
    const context = useContext(AppSettingsContext);
    if (!context) {
        throw new Error("useAppSettingsContext must be used within an AppSettingsProvider");
    }
    return context;
};
