import { UserRepository } from "../repositories/UserRepository";

export class ReplicateFromTableUseCase {
    constructor(private userRepository: UserRepository) {}

    execute(): void {
        return;
    }
}
