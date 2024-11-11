import _ from "lodash";
import { anything, instance, mock, when, capture } from "ts-mockito";
import { sourceUser } from "./data/user";

import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";

import { ReplicateFromTemplateUseCase } from "../ReplicateFromTemplateUseCase";
import { User } from "../../entities/User";
import { Future } from "../../entities/Future";
import { MetadataResponse } from "@eyeseetea/d2-api/api";
import { getFromTemplate } from "../../../utils/template";

let userRepositoryMock: UserD2ApiRepository;
let replicateFromTemplateUseCase: ReplicateFromTemplateUseCase;
let generatedUsers: User[] = [];

describe("ReplicateFromTemplateUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        replicateFromTemplateUseCase = new ReplicateFromTemplateUseCase(instance(userRepositoryMock));
    });

    it("Should replicate provided user", async () => {
        const count = 1;
        const usernameTemplate = sourceUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: User[] = givenAnExpectedUsers(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, count, usernameTemplate, passwordTemplate).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should replicate provided user 'count' times", async () => {
        const count = 3;
        const usernameTemplate = sourceUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: User[] = givenAnExpectedUsers(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, count, usernameTemplate, passwordTemplate).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should disble openID from replicated users", async () => {
        const openIdUser: User = {
            ...sourceUser,
            externalAuth: true,
            openId: "openId",
        };

        const count = 1;
        const usernameTemplate = openIdUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: User[] = givenAnExpectedUsers(openIdUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, count, usernameTemplate, passwordTemplate).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should disble LDAP from replicated users", async () => {
        const ldapUser: User = {
            ...sourceUser,
            externalAuth: true,
            ldapId: "ldapId",
        };

        const count = 1;
        const usernameTemplate = ldapUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: User[] = givenAnExpectedUsers(ldapUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, count, usernameTemplate, passwordTemplate).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should disble twoFA from replicated users", async () => {
        const tfaUser: User = {
            ...sourceUser,
            twoFA: true,
        };

        const count = 1;
        const usernameTemplate = tfaUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: User[] = givenAnExpectedUsers(tfaUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, count, usernameTemplate, passwordTemplate).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    function givenAnExpectedUsers(
        user: User,
        count: number,
        usernameTemplate: string,
        passwordTemplate: string
    ): User[] {
        when(userRepositoryMock.save(anything())).thenReturn(Future.success({ status: "OK" } as MetadataResponse));

        return _.times(count, index => {
            return {
                ...user,
                id: "",
                username: getFromTemplate(usernameTemplate, index),
                password: getFromTemplate(passwordTemplate, index),
                externalAuth: false,
                twoFA: false,
                openId: "",
                ldapId: "",
            };
        });
    }

    function compareUsers(generatedUsers: User[], expectedUsers: User[]) {
        expect(generatedUsers).toHaveLength(expectedUsers.length);

        generatedUsers.forEach((user, index) => {
            const generatedUser = {
                ...user,
                id: "",
            };

            expect(generatedUser).toEqual(expectedUsers[index]);
        });
    }
});
