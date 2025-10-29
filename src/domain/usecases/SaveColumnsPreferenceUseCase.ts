import { FutureData } from "../entities/Future";
import { Column } from "../entities/UserColumn";
import { UserColumnRepository } from "../repositories/UserColumnRepository";

export class SaveColumnsPreferenceUseCase {
    constructor(private userColumnRepository: UserColumnRepository) {}

    execute(columns: Column[]): FutureData<void> {
        return this.userColumnRepository.save(columns);
    }
}
