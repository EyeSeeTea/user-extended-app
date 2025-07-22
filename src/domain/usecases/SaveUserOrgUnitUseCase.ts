import _ from "lodash";

import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UpdateStrategy, UserRepository } from "../repositories/UserRepository";
import { Id } from "../entities/Ref";
import { OrgUnit } from "../entities/OrgUnit";

export class SaveUserOrgUnitUseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(options: SaveUserOrgUnitOptions): FutureData<void> {
        const usersToSave = this.applyOrgUnitsToUsers(options);
        return this.saveUsers(usersToSave);
    }

    private applyOrgUnitsToUsers(options: SaveUserOrgUnitOptions): UserProps[] {
        return options.users.map(user => {
            const orgUnits = this.getOrgUnits(options, this.getOrgUnitFromType(user, options));
            const userOrgUnits = this.buildUserWithOrgUnits(options.orgUnitType, orgUnits);
            return { ...user, ...userOrgUnits };
        });
    }

    private buildUserWithOrgUnits(
        orgUnitType: SaveUserOrgUnitOptions["orgUnitType"],
        orgUnits: OrgUnit[]
    ): Partial<UserProps> {
        switch (orgUnitType) {
            case "capture":
                return { organisationUnits: orgUnits };
            case "output":
                return { dataViewOrganisationUnits: orgUnits };
            case "search":
                return { searchOrganisationsUnits: orgUnits };
        }
    }

    private getOrgUnitFromType(user: UserProps, options: SaveUserOrgUnitOptions): OrgUnit[] {
        switch (options.orgUnitType) {
            case "capture":
                return user.organisationUnits;
            case "output":
                return user.dataViewOrganisationUnits;
            case "search":
                return user.searchOrganisationsUnits;
        }
    }

    private getOrgUnits(options: SaveUserOrgUnitOptions, organisationUnits: OrgUnit[]): OrgUnit[] {
        switch (options.updateStrategy) {
            case "replace":
                return options.orgUnitsIds.map(orgUnitId => this.createOrgUnit(orgUnitId));
            case "merge":
                return _(options.orgUnitsIds)
                    .map(orgUnitId => this.createOrgUnit(orgUnitId))
                    .concat(organisationUnits)
                    .uniqBy(orgUnit => orgUnit.id)
                    .value();
        }
    }

    private saveUsers(users: UserProps[]): FutureData<void> {
        return this.userRepository.save(users).toVoid();
    }

    private createOrgUnit(id: Id): OrgUnit {
        return { id, name: "", code: "", path: [] };
    }
}

export type SaveUserOrgUnitOptions = {
    orgUnitsIds: Id[];
    updateStrategy: UpdateStrategy;
    users: UserProps[];
    orgUnitType: "capture" | "output" | "search";
};
