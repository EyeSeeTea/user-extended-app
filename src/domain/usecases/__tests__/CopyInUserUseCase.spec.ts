import _ from "lodash";
import { CopyInUserUseCase, CopyInUserOptions } from "../CopyInUserUseCase";
import { User } from "../../entities/User";
import { mock, instance, when, verify, anything, deepEqual } from "ts-mockito";
import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";
import { sourceUser, targetUser } from "./data/user";
import { Future } from "../../entities/Future";

let userRepositoryMock: UserD2ApiRepository;
let copyInUserUseCase: CopyInUserUseCase;

describe("CopyInUserUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        copyInUserUseCase = new CopyInUserUseCase(instance(userRepositoryMock));
    });

    it("should merge users properties with source user properties based on options", async () => {
        const options = givenAOptionsToMerge();
        const expectedUser = givenAExpectedMergedUser();

        await copyInUserUseCase.execute(options).runAsync();

        verify(userRepositoryMock.getByIds(options.selectedUsersIds)).once();
        verify(userRepositoryMock.saveInChunks(deepEqual([expectedUser]), anything())).once();
    });

    it("should replace users properties with source user properties based on options", async () => {
        const options = givenAOptionsToReplace();
        const expectedUser = givenAExpectedReplacedUser();

        await copyInUserUseCase.execute(options).runAsync();

        verify(userRepositoryMock.getByIds(options.selectedUsersIds)).once();
        verify(userRepositoryMock.saveInChunks(deepEqual([expectedUser]), anything())).once();
    });
});

function givenAOptionsToReplace(): CopyInUserOptions {
    const selectedUsersIds = [targetUser.id];

    when(userRepositoryMock.getByIds(selectedUsersIds)).thenReturn(Future.success([targetUser]));
    when(userRepositoryMock.saveInChunks(anything(), anything())).thenReturn(Future.success(undefined));

    return {
        user: sourceUser,
        selectedUsersIds: selectedUsersIds,
        updateStrategy: "replace",
        accessElements: {
            userGroups: true,
            userRoles: true,
            dataViewOrganisationUnits: false,
            organisationUnits: false,
        },
    };
}

function givenAOptionsToMerge(): CopyInUserOptions {
    const selectedUsersIds = [targetUser.id];

    when(userRepositoryMock.getByIds(selectedUsersIds)).thenReturn(Future.success([targetUser]));
    when(userRepositoryMock.saveInChunks(anything(), anything())).thenReturn(Future.success(undefined));

    return {
        user: sourceUser,
        selectedUsersIds: selectedUsersIds,
        updateStrategy: "merge",
        accessElements: {
            userGroups: true,
            userRoles: true,
            dataViewOrganisationUnits: false,
            organisationUnits: false,
        },
    };
}

function givenAExpectedReplacedUser(): User {
    return User.createExisted({
        ...targetUser,
        userGroups: sourceUser.userGroups,
        userRoles: sourceUser.userRoles,
    }).getOrThrow();
}

function givenAExpectedMergedUser(): User {
    return User.createExisted({
        ...targetUser,
        userGroups: _.unionWith(targetUser.userGroups, sourceUser.userGroups, _.isEqual),
        userRoles: _.unionWith(targetUser.userRoles, sourceUser.userRoles, _.isEqual),
    }).getOrThrow();
}
