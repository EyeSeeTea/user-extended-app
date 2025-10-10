import _ from "lodash";
import { MetadataResponse } from "@eyeseetea/d2-api/2.36";

import { generateUid } from "../../utils/uid";
import { ReplicateTemplate } from "../entities/ReplicateTemplate";

import { UseCase } from "../../CompositionRoot";
import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";
import { Future, FutureData } from "../entities/Future";

export class ReplicateFromTemplateUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}
    execute(sourceUser: User, replicateTemplate: ReplicateTemplate): FutureData<MetadataResponse> {
        try {
            const newUsers: User[] = _.times(parseInt(replicateTemplate.replicateCount), index => {
                const adjustedIndex = index + 1;
                return User.createNew({
                    ...sourceUser,
                    id: generateUid(),
                    username: ReplicateTemplate.getFromTemplate(replicateTemplate.usernameTemplate, adjustedIndex),
                    password: ReplicateTemplate.getFromTemplate(replicateTemplate.passwordTemplate, adjustedIndex),
                    externalAuth: false,
                    twoFactorEnabled: false,
                    openId: "",
                    ldapId: "",
                }).getOrThrow();
            });

            return this.userRepository.save(newUsers);
        } catch (error) {
            return Future.error(`${(error as Error).message}`);
        }
    }
}
