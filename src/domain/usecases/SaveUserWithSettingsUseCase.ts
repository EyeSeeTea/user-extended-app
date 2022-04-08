import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserWithSettings } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { MetadataResponse } from "@eyeseetea/d2-api/2.36";

export class SaveUserWithSettingsUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(userToSave: UserWithSettings): FutureData<MetadataResponse> {
        return this.userRepository.saveWithSettings(userToSave);
    }
}
