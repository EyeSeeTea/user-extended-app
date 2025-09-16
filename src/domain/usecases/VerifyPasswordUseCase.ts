import { FutureData } from "../entities/Future";
import { UserRepository } from "../repositories/UserRepository";

export class VerifyPasswordUseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(password: string): FutureData<true> {
        return this.userRepository.verifyPassword(password);
    }
}
