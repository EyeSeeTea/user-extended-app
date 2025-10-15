import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { ListOptions, UserRepository } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";

export class ListAllUserIdsUseCase implements UseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    public execute(options: ListOptions): FutureData<string[]> {
        return this.userRepository.getCurrent().flatMap(currentUser => {
            return getAppSettings(this.appSettingsRepository, currentUser).flatMap(appSettings => {
                return this.userRepository.listAllIds({ ...options, hideUsers: appSettings.hide.users });
            });
        });
    }
}
