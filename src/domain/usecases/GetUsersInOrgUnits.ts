import { FutureData } from "../entities/Future";
import { UserSimple } from "../entities/UserSimple";
import { OrgUnitRepository } from "../repositories/OrgUnitRepository";
import { UserSimpleRepository } from "../repositories/UserSimpleRepository";

export class GetUsersInOrgUnits {
    constructor(private orgUnitRepository: OrgUnitRepository, private userRepository: UserSimpleRepository) {}

    execute(): FutureData<UserSimple[]> {
        return this.orgUnitRepository.getWithUsers().flatMap(orgUnits => {
            const usersIds = orgUnits.flatMap(orgUnit => orgUnit.users ?? []);
            return this.userRepository.getByIds(usersIds);
        });
    }
}
