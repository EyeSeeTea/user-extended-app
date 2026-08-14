import { anything, capture, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { AppSettingsD2Repository } from "../../../data/repositories/AppSettingsD2Repository";
import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";
import { AppSettings } from "../../entities/AppSettings";
import { Future } from "../../entities/Future";
import { Id } from "../../entities/Ref";
import { UserIdentifier } from "../../entities/UserIdentifier";
import { UserSimple } from "../../entities/UserSimple";
import { defaultUserProps, UserProps } from "../../entities/UserProps";
import { GetUsersInOrgUnits } from "../GetUsersInOrgUnits";

const CURRENT_USER_ID = "DMvCHs61lV8";
const HIDDEN_USER_ID = "QXlprxPrPch";
const CHILD_USER = { id: "Z6hRCCmyq9f", username: "uxa-user-child", name: "Child UXA" };
const GRANDCHILD_USER = { id: "hExxx7jjwGL", username: "uxa-user-grandchild", name: "Grandchild UXA" };

let userRepositoryMock: UserD2ApiRepository;
let appSettingsRepositoryMock: AppSettingsD2Repository;
let getUsersInOrgUnits: GetUsersInOrgUnits;

describe("GetUsersInOrgUnits", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        appSettingsRepositoryMock = mock(AppSettingsD2Repository);
        getUsersInOrgUnits = new GetUsersInOrgUnits(instance(userRepositoryMock), instance(appSettingsRepositoryMock));
    });

    describe("query sent to the repository", () => {
        it("should restrict the users to the current user's org units and below", async () => {
            givenAppSettings();
            givenUsers([]);

            await getUsersInOrgUnits.execute(givenACurrentUser()).toPromise();

            verify(
                userRepositoryMock.listAllUserIdentifiers(
                    deepEqual({ onlyUsersOrgUnits: true, onlyActiveUsers: false, hideUsers: [] })
                )
            ).once();
        });

        it("should forward the users hidden in app settings so they are excluded", async () => {
            givenAppSettings({ hiddenUserIds: [HIDDEN_USER_ID] });
            givenUsers([]);

            await getUsersInOrgUnits.execute(givenACurrentUser()).toPromise();

            const [options] = capture(userRepositoryMock.listAllUserIdentifiers).last();
            expect(options.hideUsers).toEqual([HIDDEN_USER_ID]);
        });

        it("should keep disabled users even when the app only shows active ones, so the dropdown matches the table", async () => {
            givenAppSettings({ showOnlyActiveUsers: true });
            givenUsers([]);

            await getUsersInOrgUnits.execute(givenACurrentUser()).toPromise();

            const [options] = capture(userRepositoryMock.listAllUserIdentifiers).last();
            expect(options.onlyActiveUsers).toBe(false);
        });
    });

    describe("returned users", () => {
        it("should map every identifier to the entry rendered by the users filter dropdown", async () => {
            givenAppSettings();
            givenUsers([new UserIdentifier(CHILD_USER), new UserIdentifier(GRANDCHILD_USER)]);

            const users = await getUsersInOrgUnits.execute(givenACurrentUser()).toPromise();

            expect(users).toEqual([
                UserSimple.create({
                    id: CHILD_USER.id,
                    name: CHILD_USER.name,
                    firstName: CHILD_USER.name,
                    lastName: "",
                    email: "",
                    username: CHILD_USER.username,
                }),
                UserSimple.create({
                    id: GRANDCHILD_USER.id,
                    name: GRANDCHILD_USER.name,
                    firstName: GRANDCHILD_USER.name,
                    lastName: "",
                    email: "",
                    username: GRANDCHILD_USER.username,
                }),
            ]);
        });
    });
});

function givenACurrentUser(): UserProps {
    return { ...defaultUserProps, id: CURRENT_USER_ID, authorities: ["F_USER_ADD"] };
}

function givenAppSettings(options: { hiddenUserIds?: Id[]; showOnlyActiveUsers?: boolean } = {}): void {
    const { hiddenUserIds = [], showOnlyActiveUsers = false } = options;
    const defaultSettings = AppSettings.defaultSettings("active");
    const appSettings = AppSettings.create({
        ...defaultSettings._getAttributes(),
        hide: { ...defaultSettings.hide, users: hiddenUserIds },
        showOnlyActiveUsers: showOnlyActiveUsers,
    });

    when(appSettingsRepositoryMock.get()).thenReturn(Future.success(appSettings));
}

function givenUsers(identifiers: UserIdentifier[]): void {
    when(userRepositoryMock.listAllUserIdentifiers(anything())).thenReturn(Future.success(identifiers));
}
