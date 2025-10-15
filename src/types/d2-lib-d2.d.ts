declare module "d2/lib/d2" {
    import { LegacyD2I18n } from "./d2-legacy-i18n";

    interface D2 {
        i18n: LegacyD2I18n;
        [key: string]: any;
    }

    interface D2InitConfig {
        baseUrl?: string;
        headers?: Record<string, string>;
        schemas?: string[];
        i18n?: {
            sources?: string[];
        };
    }

    export function getInstance(): Promise<D2>;
    export function init(config: D2InitConfig): Promise<D2>;
    export function generateUid(): string;
    export const i18n: LegacyD2I18n;
}
