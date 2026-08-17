import { anything, instance, mock, verify, when } from "ts-mockito";
import { AppSettingsD2Repository } from "../../../data/repositories/AppSettingsD2Repository";
import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";
import { MetadataResponse } from "../../../types/d2-api";
import { AppSettings } from "../../entities/AppSettings";
import { Future } from "../../entities/Future";
import { OrgUnit } from "../../entities/OrgUnit";
import { User } from "../../entities/User";
import { defaultUserProps } from "../../entities/UserProps";
import { SetUserPasswordUseCase } from "../SetUserPasswordUseCase";

const myOrgUnit: OrgUnit = { id: "mine", name: "mine", code: "mine", path: ["parent", "mine"] };
const childOrgUnit: OrgUnit = { id: "child", name: "child", code: "child", path: ["parent", "mine", "child"] };
const otherOrgUnit: OrgUnit = { id: "other", name: "other", code: "other", path: ["other"] };

let userRepositoryMock: UserD2ApiRepository;
let appSettingsRepositoryMock: AppSettingsD2Repository;
let setUserPasswordUseCase: SetUserPasswordUseCase;

describe("SetUserPasswordUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        appSettingsRepositoryMock = mock(AppSettingsD2Repository);
        setUserPasswordUseCase = new SetUserPasswordUseCase(
            instance(userRepositoryMock),
            instance(appSettingsRepositoryMock)
        );
    });

    it("should save the user when the setting is disabled, even outside the org units", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: false });
        const userToSave = givenUserToSave([otherOrgUnit]);

        const result = await setUserPasswordUseCase.execute(userToSave).runAsync();

        expect(result.data).toBeDefined();
        verify(userRepositoryMock.save(anything())).once();
    });

    it("should save the user when it belongs to an org unit below the current user's", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true });
        const userToSave = givenUserToSave([childOrgUnit]);

        const result = await setUserPasswordUseCase.execute(userToSave).runAsync();

        expect(result.data).toBeDefined();
        verify(userRepositoryMock.save(anything())).once();
    });

    it("should not save the user when it is outside the current user's org units", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true });
        const userToSave = givenUserToSave([otherOrgUnit]);

        const result = await setUserPasswordUseCase.execute(userToSave).runAsync();

        expect(result.error).toBeDefined();
        verify(userRepositoryMock.verifyPassword(anything())).never();
        verify(userRepositoryMock.save(anything())).never();
    });

    it("should save the user when the current user is a super admin", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true, isSuperAdmin: true });
        const userToSave = givenUserToSave([otherOrgUnit]);

        const result = await setUserPasswordUseCase.execute(userToSave).runAsync();

        expect(result.data).toBeDefined();
        verify(userRepositoryMock.save(anything())).once();
    });
});

function givenRepositories(options: {
    currentUserOrgUnits: OrgUnit[];
    isLimited: boolean;
    isSuperAdmin?: boolean;
}): void {
    const currentUser = new User({
        ...defaultUserProps,
        id: "current",
        username: "current",
        authorities: options.isSuperAdmin ? ["ALL"] : [],
        organisationUnits: options.currentUserOrgUnits,
    });

    const appSettings = AppSettings.create({
        ...AppSettings.defaultSettings("active"),
        limitPasswordActionsToUserOrgUnits: options.isLimited,
    });

    when(userRepositoryMock.getCurrent()).thenReturn(Future.success(currentUser));
    when(appSettingsRepositoryMock.get()).thenReturn(Future.success(appSettings));
    when(userRepositoryMock.verifyPassword(anything())).thenReturn(Future.success(true));
    when(userRepositoryMock.save(anything())).thenReturn(Future.success({ status: "OK" } as MetadataResponse));
}

function givenUserToSave(organisationUnits: OrgUnit[]): User {
    return new User({
        ...defaultUserProps,
        id: "target",
        username: "target",
        password: "ValidPassword123!",
        organisationUnits,
    });
}
