import { Struct } from "./generic/Struct";
import { Id } from "./Ref";
import { UserSimple } from "./UserSimple";

export type DashboardAttrs = {
    id: Id;
    name: string;
    description: string;
    owner: UserSimple;
    users: UserSimple[];
};

export class Dashboard extends Struct<DashboardAttrs>() {}
