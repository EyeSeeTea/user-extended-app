import { FutureData } from "../entities/Future";
import { InstanceRepository } from "../repositories/InstanceRepository";

export class VerifyPasswordUseCase {
    constructor(private instanceRepository: InstanceRepository) {}

    public execute(password: string): FutureData<true> {
        return this.instanceRepository.verifyPassword(password);
    }
}
