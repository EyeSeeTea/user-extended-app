import { UseCase } from "../../CompositionRoot";
import i18n from "../../locales";
import { Future, FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { MetadataResponse } from "../../types/d2-api";

export class SaveUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(usersToSave: UserProps[]): FutureData<MetadataResponse> {
        if (User.validateUniqueOpenId(usersToSave)) {
            try {
                const users = usersToSave.map(userProps => User.createNewUser(userProps));
                return this.userRepository.save(users);
            } catch (error) {
                return Future.error(`${(error as Error).message}`);
            }
        } else {
            return Future.error(i18n.t("Open IDs must be unique"));
        }
    }
}
