import { UseCase } from "../../CompositionRoot";
import i18n from "../../locales";
import { Future, FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { MetadataResponse } from "@eyeseetea/d2-api/2.36";

export class SaveUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(usersToSave: UserProps[]): FutureData<MetadataResponse> {
        return User.validateUniqueOpenId(usersToSave)
            ? this.userRepository.save(usersToSave)
            : Future.error(i18n.t("Open IDs must be unique"));
    }
}
