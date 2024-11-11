import _ from "lodash";
import { MetadataResponse } from "@eyeseetea/d2-api/2.36";

import { generateUid } from "../../utils/uid";
import { getFromTemplate } from "../../utils/template";

import { UseCase } from "../../CompositionRoot";
import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";
import { FutureData } from "../entities/Future";

export class ReplicateFromTemplateUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}
    execute(
        sourceUser: User,
        count: number,
        usernameTemplate: string,
        passwordTemplate: string
    ): FutureData<MetadataResponse> {
        const newUsers: User[] = _.times(count, index => {
            return {
                ...sourceUser,
                id: generateUid(),
                username: getFromTemplate(usernameTemplate, index),
                password: getFromTemplate(passwordTemplate, index),
                externalAuth: false,
                twoFA: false,
                openId: "",
                ldapId: "",
            };
        });

        return this.userRepository.save(newUsers);
    }
}
