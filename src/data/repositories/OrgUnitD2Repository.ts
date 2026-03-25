import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/entities/Future";
import { OrgUnit } from "../../domain/entities/OrgUnit";
import { OrgUnitRepository } from "../../domain/repositories/OrgUnitRepository";
import { apiToFuture } from "../../utils/futures";

export class OrgUnitD2Repository implements OrgUnitRepository {
    constructor(private api: D2Api) {}

    getWithUsers(): FutureData<OrgUnit[]> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: {
                    id: true,
                    displayName: true,
                    level: true,
                    code: true,
                    path: true,
                    users: { id: true, displayName: true },
                },
                userOnly: true,
                paging: false,
            })
        ).map(d2Response => {
            return d2Response.objects.map((d2OrgUnit): OrgUnit => {
                return this.buildOrgUnits(d2OrgUnit);
            });
        });
    }

    private buildOrgUnits(d2OrgUnit: D2OrgUnit): OrgUnit {
        return {
            id: d2OrgUnit.id,
            name: d2OrgUnit.displayName,
            level: d2OrgUnit.level,
            code: d2OrgUnit.code,
            path: d2OrgUnit.path.split("/").slice(1),
            users: d2OrgUnit.users.map(user => user.id),
        };
    }
}

type D2OrgUnit = {
    id: string;
    displayName: string;
    level: number;
    code: string;
    path: string;
    users: { id: string; displayName: string }[];
};
