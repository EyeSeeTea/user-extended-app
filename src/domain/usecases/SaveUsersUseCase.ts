import { UseCase } from "../../CompositionRoot";
import i18n from "../../locales";
import { Future, FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { UserLogic } from "../entities/UserLogic";
import { UserRepository } from "../repositories/UserRepository";
import { MetadataResponse } from "../../types/d2-api";

export class SaveUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(usersToSave: User[]): FutureData<MetadataResponse> {
        return UserLogic.validateUniqueOpenId(usersToSave)
            ? this.userRepository.save(usersToSave)
            : Future.error(i18n.t("Open IDs must be unique"));
    }
}
