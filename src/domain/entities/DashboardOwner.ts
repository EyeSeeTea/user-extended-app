import { Struct } from "./generic/Struct";
import { Id } from "./Ref";

type DashboardOwnerAttrs = {
    id: Id;
    name: string;
};

export class DashboardOwner extends Struct<DashboardOwnerAttrs>() {
    static build(attrs: DashboardOwnerAttrs): DashboardOwner {
        return this.create({ id: attrs.id, name: attrs.name });
    }
}
