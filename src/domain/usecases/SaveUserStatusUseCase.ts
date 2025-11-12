import { UseCase } from "../../CompositionRoot";
import { Future, FutureData } from "../entities/Future";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class SaveUserStatusUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(users: User[], options: SaveUserStatusOptions): FutureData<void> {
        try {
            const usersToUpdate = users.map(user => {
                return User.createNew({ ...user, disabled: options.disabled }).getOrThrow();
            });
            return this.userRepository.save(usersToUpdate).toVoid();
        } catch (error) {
            return Future.error(`${(error as Error).message}`);
        }
    }
}

type SaveUserStatusOptions = { disabled: boolean };
