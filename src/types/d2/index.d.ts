import { D2OldI18n } from "../d2-old-i18n";

declare module "d2/lib/d2" {
    export interface D2 {
        i18n: D2OldI18n;
        [key: string]: any;
    }

    export function init(config: { baseUrl: string; headers?: Record<string, any>; schemas?: string[] }): Promise<D2>;

    export function generateUid(): string;
    export const i18n: D2OldI18n;
}
