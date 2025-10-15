import { UseCase } from "../../CompositionRoot";
import i18n from "../../utils/i18n";
import { Future, FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { UserLogic } from "../entities/UserLogic";
import { UserRepository } from "../repositories/UserRepository";
import { MetadataResponse } from "@eyeseetea/d2-api/2.36";

export class SaveUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(usersToSave: User[]): FutureData<MetadataResponse> {
        return UserLogic.validateUniqueOpenId(usersToSave)
            ? this.userRepository.save(usersToSave)
            : Future.error(i18n.t("Open IDs must be unique"));
    }
}
