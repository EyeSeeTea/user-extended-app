import { Struct } from "./generic/Struct";
import { Id, NamedRef } from "./Ref";

export type DashboardAttrs = {
    id: Id;
    name: string;
    description: string;
    owner: NamedRef;
    users: NamedRef[];
};

export class Dashboard extends Struct<DashboardAttrs>() {}
