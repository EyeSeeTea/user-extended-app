import _ from "lodash";

import { generateUid } from "../../utils/uid";
import { getFromTemplate } from "../../utils/templates";

import { UserRepository } from "../repositories/UserRepository";

import { User, defaultUser, userCredentials } from "../entities/User";

export class ReplicateFromTemplateUseCase {
    constructor(private userRepository: UserRepository) {}

    execute(source_user: User, count: number, usernameTemplate: string, passwordTemplate: string): void {
        const userIds: string[] = _.times(count, () => generateUid());
        const usernames = getFromTemplate(usernameTemplate, count);
        const passwords = getFromTemplate(passwordTemplate, count);
        const values = [userIds, usernames, passwords];

        const user: User = {
            userCredentials: {},
        };
    }
}
