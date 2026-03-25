import { MetadataResponse } from "../../types/d2-api";
import { FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class SetUserPasswordUseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(userToSave: User): FutureData<MetadataResponse> {
        return this.userRepository
            .verifyPassword(userToSave.password)
            .flatMap(() => this.userRepository.save([userToSave]));
    }
}
