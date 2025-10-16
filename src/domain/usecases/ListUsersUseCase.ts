import { Pager } from "@eyeseetea/d2-ui-components";
import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { AppSettingsRepository } from "../repositories/AppSettingsRepository";
import { UserRepository, ListOptions } from "../repositories/UserRepository";
import { getAppSettings } from "./common/settings";

export class ListUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository, private appSettingsRepository: AppSettingsRepository) {}

    public execute(options: ListOptions): FutureData<{ pager: Pager; objects: User[] }> {
        return this.userRepository.getCurrent().flatMap(currentUser => {
            return getAppSettings(this.appSettingsRepository, currentUser).flatMap(appSettings => {
                return this.userRepository.list({
                    ...options,
                    hideUsers: appSettings.hide.users,
                });
            });
        });
    }
}
