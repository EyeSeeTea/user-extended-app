import { Pager } from "@eyeseetea/d2-ui-components";
import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { UserRepository, ListOptions } from "../repositories/UserRepository";

export class ListUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(options: ListOptions): FutureData<{ pager: Pager; objects: UserProps[] }> {
        return this.userRepository.list(options);
    }
}
