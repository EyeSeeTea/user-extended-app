import { anything, instance, mock, verify, when } from "ts-mockito";
import { AppSettingsD2Repository } from "../../../data/repositories/AppSettingsD2Repository";
import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";
import { AppSettings } from "../../entities/AppSettings";
import { Future } from "../../entities/Future";
import { OrgUnit } from "../../entities/OrgUnit";
import { Stats } from "../../entities/Stats";
import { User } from "../../entities/User";
import { defaultUserProps } from "../../entities/UserProps";
import { ResetUsersPasswordsUseCase } from "../ResetUsersPasswordsUseCase";

const myOrgUnit: OrgUnit = { id: "mine", name: "mine", code: "mine", path: ["parent", "mine"] };
const childOrgUnit: OrgUnit = { id: "child", name: "child", code: "child", path: ["parent", "mine", "child"] };
const otherOrgUnit: OrgUnit = { id: "other", name: "other", code: "other", path: ["other"] };

let userRepositoryMock: UserD2ApiRepository;
let appSettingsRepositoryMock: AppSettingsD2Repository;
let resetUsersPasswordsUseCase: ResetUsersPasswordsUseCase;

describe("ResetUsersPasswordsUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        appSettingsRepositoryMock = mock(AppSettingsD2Repository);
        resetUsersPasswordsUseCase = new ResetUsersPasswordsUseCase(
            instance(userRepositoryMock),
            instance(appSettingsRepositoryMock)
        );
    });

    it("should reset passwords when the setting is disabled, even outside the org units", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: false });
        const users = [givenUser("out", [otherOrgUnit])];

        const result = await resetUsersPasswordsUseCase.execute(users).runAsync();

        expect(result.data).toBeDefined();
        verify(userRepositoryMock.resetPasswords(anything())).once();
    });

    it("should reset passwords for users below the current user's org units", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true });
        const users = [givenUser("mine", [myOrgUnit]), givenUser("child", [childOrgUnit])];

        const result = await resetUsersPasswordsUseCase.execute(users).runAsync();

        expect(result.data).toBeDefined();
        verify(userRepositoryMock.resetPasswords(anything())).once();
    });

    it("should not reset passwords when a single user is outside the current user's org units", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true });
        const users = [givenUser("child", [childOrgUnit]), givenUser("other", [otherOrgUnit])];

        const result = await resetUsersPasswordsUseCase.execute(users).runAsync();

        expect(result.error).toBeDefined();
        verify(userRepositoryMock.resetPasswords(anything())).never();
    });

    it("should reset passwords when the current user is a super admin", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true, isSuperAdmin: true });
        const users = [givenUser("other", [otherOrgUnit])];

        const result = await resetUsersPasswordsUseCase.execute(users).runAsync();

        expect(result.data).toBeDefined();
        verify(userRepositoryMock.resetPasswords(anything())).once();
    });

    it("should keep failing when users have no email", async () => {
        givenRepositories({ currentUserOrgUnits: [myOrgUnit], isLimited: true });
        const users = [givenUser("child", [childOrgUnit], { email: "" })];

        const result = await resetUsersPasswordsUseCase.execute(users).runAsync();

        expect(result.error).toBeDefined();
        verify(userRepositoryMock.resetPasswords(anything())).never();
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
    when(userRepositoryMock.resetPasswords(anything())).thenReturn(Future.success(Stats.empty()));
}

function givenUser(id: string, organisationUnits: OrgUnit[], overrides?: { email: string }): User {
    return new User({
        ...defaultUserProps,
        id,
        username: id,
        email: overrides?.email ?? `${id}@example.com`,
        organisationUnits,
    });
}
