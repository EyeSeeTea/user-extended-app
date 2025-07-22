import _ from "lodash";

import { Future, FutureData } from "../entities/Future";
import { UserProps } from "../entities/UserProps";
import { AccessElements, UpdateStrategy, AccessElementsKeys, UserRepository } from "../repositories/UserRepository";
import { Id } from "../entities/Ref";

export class CopyInUserUseCase {
    constructor(private userRepository: UserRepository) {}

    public execute(options: CopyInUserOptions): FutureData<void> {
        return this.getUsersToUpdate(options.selectedUsersIds).flatMap(users => {
            const usersBatches = _.chunk(users, 50);

            const $requests = usersBatches.map(usersToUpdate => {
                const usersToSave = this.applyCopyToUsers(usersToUpdate, options);
                return this.saveUsers(usersToSave);
            });

            return Future.sequential($requests).toVoid();
        });
    }

    private applyCopyToUsers(usersToUpdate: UserProps[], options: CopyInUserOptions): UserProps[] {
        return usersToUpdate.map(userToUpdate => this.updateUser(userToUpdate, options));
    }

    private getUsersToUpdate(selectedUsersIds: Id[]): FutureData<UserProps[]> {
        return this.userRepository.getByIds(selectedUsersIds);
    }

    private replaceAccessElementsKeys(targetUser: UserProps, sourceUser: UserProps, properties: AccessElementsKeys[]): UserProps {
        return { ...targetUser, ..._.pick(sourceUser, properties) };
    }

    private mergeAccessElementsKeys(targetUser: UserProps, sourceUser: UserProps, properties: AccessElementsKeys[]): UserProps {
        const pickedSource = _.pick(sourceUser, properties);

        // Custom merge logic to handle arrays
        const customizer = (objValue: UserProps[AccessElementsKeys], srcValue: UserProps[AccessElementsKeys]) =>
            _.unionWith(objValue, srcValue, _.isEqual);

        // Merge the picked properties into the target user using the custom merge function
        return _.mergeWith(targetUser, pickedSource, customizer);
    }

    private updateUser(targetUser: UserProps, options: CopyInUserOptions): UserProps {
        const sourceUser = options.user;
        // Filter and get keys names of selected user properties to update
        const propertiesToUpdate = _(options.accessElements)
            .pickBy(isSelected => isSelected === true)
            .keys()
            .value() as AccessElementsKeys[];

        switch (options.updateStrategy) {
            case "replace":
                return this.replaceAccessElementsKeys(targetUser, sourceUser, propertiesToUpdate);
            case "merge":
                return this.mergeAccessElementsKeys(targetUser, sourceUser, propertiesToUpdate);
        }
    }

    private saveUsers(users: UserProps[]): FutureData<void> {
        return this.userRepository.save(users).toVoid();
    }
}

export type CopyInUserOptions = {
    user: UserProps;
    selectedUsersIds: Id[];
    updateStrategy: UpdateStrategy;
    accessElements: AccessElements;
};
