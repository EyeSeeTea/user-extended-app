import { MetadataResponse } from "@eyeseetea/d2-api/2.36";
import { FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class SetUserPasswordUseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(userToSave: User): FutureData<MetadataResponse> {
        return this.userRepository.save([userToSave]);
    }
}
