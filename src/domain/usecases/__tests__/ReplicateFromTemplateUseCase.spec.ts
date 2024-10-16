import _ from "lodash";
import { anything, deepEqual, instance, mock, when, verify } from "ts-mockito";
import { sourceUser } from "./data/user";

import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";

import { ReplicateFromTemplateUseCase } from "../ReplicateFromTemplateUseCase";
import { User } from "../../entities/User";

let userRepositoryMock: UserD2ApiRepository;
let replicateFromTemplateUseCase: ReplicateFromTemplateUseCase;

describe("ReplicateFromTemplateUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        replicateFromTemplateUseCase = new ReplicateFromTemplateUseCase(instance(userRepositoryMock));
    });

    it("Should replicate provided user", async () => {
        const expectedUser: User = {
            ...sourceUser,
            username: sourceUser.username + "_1",
            password: sourceUser.password + "_1",
        };

        const replicatedUser = replicateFromTemplateUseCase.execute(sourceUser, 1, "_1", "_1");

        expect(replicatedUser).toEqual(expectedUser);
    });

    it("Should disble openID from replicated users", async () => {
        const openIdUser: User = {
            ...sourceUser,
            twoFA: true,
            openId: "openId",
        };

        const expectedUser: User = {
            ...openIdUser,
            twoFA: false,
            openId: undefined,
            username: sourceUser.username + "_1",
            password: sourceUser.password + "_1",
        };

        const replicatedUser = replicateFromTemplateUseCase.execute(openIdUser, 1, "_1", "_1");

        expect(replicatedUser).toEqual(expectedUser);
    });

    it("Should disble openID from replicated users", async () => {
        const ldapUser: User = {
            ...sourceUser,
            twoFA: true,
            ldapId: "ldapId",
        };

        const expectedUser: User = {
            ...ldapUser,
            twoFA: false,
            openId: undefined,
            username: sourceUser.username + "_1",
            password: sourceUser.password + "_1",
        };

        const replicatedUser = replicateFromTemplateUseCase.execute(ldapUser, 1, "_1", "_1");

        expect(replicatedUser).toEqual(expectedUser);
    });

    it("Should check if username is unique", async () => {
        // add duplicate user error
    });
});
