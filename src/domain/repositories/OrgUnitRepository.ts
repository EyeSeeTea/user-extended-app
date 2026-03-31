import { FutureData } from "../entities/Future";
import { OrgUnit } from "../entities/OrgUnit";

export interface OrgUnitRepository {
    getWithUsers(): FutureData<OrgUnit[]>;
}
