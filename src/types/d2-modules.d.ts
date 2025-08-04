import { D2OldI18n } from "./d2-old-i18n";

declare module "d2/lib/d2" {
    interface D2 {
        i18n: D2OldI18n;
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
    export const i18n: D2OldI18n;
}

declare module "d2/lib/uid" {
    export function generateUid(): string;
}
