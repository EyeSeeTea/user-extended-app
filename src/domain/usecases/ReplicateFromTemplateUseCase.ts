import _ from "lodash";
import { MetadataResponse } from "@eyeseetea/d2-api/2.36";

import { generateUid } from "../../utils/uid";
import { ReplicateTemplate } from "../entities/ReplicateTemplate";

import { UseCase } from "../../CompositionRoot";
import { UserRepository } from "../repositories/UserRepository";
import { UserProps } from "../entities/UserProps";
import { FutureData } from "../entities/Future";

export class ReplicateFromTemplateUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}
    execute(
        sourceUser: UserProps,
        count: number,
        usernameTemplate: string,
        passwordTemplate: string
    ): FutureData<MetadataResponse> {
        const newUsers: UserProps[] = _.times(count, index => {
            const adjustedIndex = index + 1;
            return {
                ...sourceUser,
                id: generateUid(),
                username: ReplicateTemplate.getFromTemplate(usernameTemplate, adjustedIndex),
                password: ReplicateTemplate.getFromTemplate(passwordTemplate, adjustedIndex),
                externalAuth: false,
                twoFactorEnabled: false,
                openId: "",
                ldapId: "",
            };
        });

        return this.userRepository.save(newUsers);
    }
}
