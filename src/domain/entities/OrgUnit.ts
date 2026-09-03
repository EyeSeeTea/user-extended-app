import { Id } from "./Ref";

export type OrgUnit = { id: Id; name: string; code: string; path: string[]; level?: number; users?: string[] };

export type OrgUnitKey = keyof OrgUnit;
