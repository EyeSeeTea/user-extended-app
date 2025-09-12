import _ from "lodash";
import { anything, instance, mock, when, capture } from "ts-mockito";
import { sourceUser } from "./data/user";

import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";

import { ReplicateFromTemplateUseCase } from "../ReplicateFromTemplateUseCase";
import { UserProps } from "../../entities/UserProps";
import { Future } from "../../entities/Future";
import { MetadataResponse } from "@eyeseetea/d2-api/api";
import { ReplicateTemplate } from "../../entities/ReplicateTemplate";

let userRepositoryMock: UserD2ApiRepository;
let replicateFromTemplateUseCase: ReplicateFromTemplateUseCase;
let generatedUsers: UserProps[] = [];

describe("ReplicateFromTemplateUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        replicateFromTemplateUseCase = new ReplicateFromTemplateUseCase(instance(userRepositoryMock));
    });

    it("Should replicate provided user", async () => {
        const count = 1;
        const usernameTemplate = sourceUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: UserProps[] = givenAnExpectedUsers(sourceUser, count, usernameTemplate, passwordTemplate);
        const template = givenAnExpectedTemplate(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, template).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should replicate provided user 'count' times", async () => {
        const count = 3;
        const usernameTemplate = sourceUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: UserProps[] = givenAnExpectedUsers(sourceUser, count, usernameTemplate, passwordTemplate);
        const template = givenAnExpectedTemplate(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, template).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should disble openID from replicated users", async () => {
        const openIdUser: UserProps = {
            ...sourceUser,
            externalAuth: true,
            openId: "openId",
        };

        const count = 1;
        const usernameTemplate = openIdUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: UserProps[] = givenAnExpectedUsers(openIdUser, count, usernameTemplate, passwordTemplate);
        const template = givenAnExpectedTemplate(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, template).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should disble LDAP from replicated users", async () => {
        const ldapUser: UserProps = {
            ...sourceUser,
            externalAuth: true,
            ldapId: "ldapId",
        };

        const count = 1;
        const usernameTemplate = ldapUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: UserProps[] = givenAnExpectedUsers(ldapUser, count, usernameTemplate, passwordTemplate);
        const template = givenAnExpectedTemplate(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, template).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    it("Should disble twoFactorEnabled from replicated users", async () => {
        const tfaUser: UserProps = {
            ...sourceUser,
            twoFactorEnabled: true,
        };

        const count = 1;
        const usernameTemplate = tfaUser.username + "_$index";
        const passwordTemplate = "District123_$index";

        const expectedUsers: UserProps[] = givenAnExpectedUsers(tfaUser, count, usernameTemplate, passwordTemplate);
        const template = givenAnExpectedTemplate(sourceUser, count, usernameTemplate, passwordTemplate);

        await replicateFromTemplateUseCase.execute(sourceUser, template).runAsync();

        [generatedUsers] = capture(userRepositoryMock.save).last();
        compareUsers(generatedUsers, expectedUsers);
    });

    function givenAnExpectedTemplate(
        user: UserProps,
        count: number,
        usernameTemplate: string,
        passwordTemplate: string
    ): ReplicateTemplate {
        when(userRepositoryMock.save(anything())).thenReturn(Future.success({ status: "OK" } as MetadataResponse));

        return new ReplicateTemplate(
            {
                replicateCount: count.toString(),
                usernameTemplate,
                passwordTemplate,
            },
            [user.username]
        );
    }

    function givenAnExpectedUsers(
        user: UserProps,
        count: number,
        usernameTemplate: string,
        passwordTemplate: string
    ): UserProps[] {
        when(userRepositoryMock.save(anything())).thenReturn(Future.success({ status: "OK" } as MetadataResponse));

        return _.times(count, index => {
            return {
                ...user,
                id: "",
                username: ReplicateTemplate.getFromTemplate(usernameTemplate, index + 1),
                password: ReplicateTemplate.getFromTemplate(passwordTemplate, index + 1),
                externalAuth: false,
                twoFactorEnabled: false,
                openId: "",
                ldapId: "",
            };
        });
    }

    function compareUsers(generatedUsers: UserProps[], expectedUsers: UserProps[]) {
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
