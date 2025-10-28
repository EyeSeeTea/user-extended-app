import { UseCase } from "../../CompositionRoot";
import i18n from "../../utils/i18n";
import { Future, FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { MetadataResponse } from "../../types/d2-api";
import { isUniqueOpenId } from "../utils/isUniqueOpenId";

export class SaveUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(usersToSave: UserProps[]): FutureData<MetadataResponse> {
        if (!isUniqueOpenId(usersToSave)) return Future.error(i18n.t("Open IDs must be unique"));

        try {
            const users = usersToSave.map(userProps => User.createNew(userProps).getOrThrow());
            return this.userRepository.save(users);
        } catch (error) {
            return Future.error(i18n.t((error as Error).message));
        }
    }
}
