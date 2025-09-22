import { UseCase } from "../../CompositionRoot";
import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { UserColumns } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class ResetColumnsUserCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    execute(appSettings: AppSettings): FutureData<UserColumns[]> {
        const columns = appSettings.columns
            .filter(column => column.value === "mandatory" || column.value === "visible")
            .map(column => column.field);
        return this.userRepository.saveColumns(columns).map(() => columns);
    }
}
