import { instance, mock, when } from "ts-mockito";
import { AppSettings, ColumnSettingValue } from "../../entities/AppSettings";
import { Future } from "../../entities/Future";
import { Column } from "../../entities/UserColumn";
import { defaultUserProps, UserProps } from "../../entities/UserProps";
import { UserColumnD2Repository } from "../../../data/repositories/UserColumnD2Repository";
import { AppSettingsD2Repository } from "../../../data/repositories/AppSettingsD2Repository";
import { GetColumnsPreferencesUseCase } from "../GetColumnsPreferencesUseCase";

const COLUMN_FIELD = "email";
const SUPER_ADMIN = buildUser(["ALL"]);
const REGULAR_USER = buildUser(["F_USER_ADD"]);

let userColumnRepositoryMock: UserColumnD2Repository;
let appSettingsRepositoryMock: AppSettingsD2Repository;
let getColumnsPreferencesUseCase: GetColumnsPreferencesUseCase;

describe("GetColumnsPreferencesUseCase", () => {
    beforeEach(() => {
        userColumnRepositoryMock = mock(UserColumnD2Repository);
        appSettingsRepositoryMock = mock(AppSettingsD2Repository);
        getColumnsPreferencesUseCase = new GetColumnsPreferencesUseCase(
            instance(userColumnRepositoryMock),
            instance(appSettingsRepositoryMock)
        );
    });

    describe("columns configured as disabled", () => {
        it("should be excluded for a user without the ALL authority", async () => {
            givenColumnSetting("disabled");
            givenColumnPreferences([]);

            const columns = await getColumnsPreferencesUseCase.execute(REGULAR_USER).toPromise();

            expect(columns).toEqual([]);
        });

        it("should be returned as unselected for a super admin, so they can enable them", async () => {
            givenColumnSetting("disabled");
            givenColumnPreferences([]);

            const columns = await getColumnsPreferencesUseCase.execute(SUPER_ADMIN).toPromise();

            expect(columns).toEqual([{ fieldName: COLUMN_FIELD, state: "unselected", position: -1 }]);
        });

        it("should keep the stored preference of a super admin", async () => {
            givenColumnSetting("disabled");
            givenColumnPreferences([buildColumn("selected", 2)]);

            const columns = await getColumnsPreferencesUseCase.execute(SUPER_ADMIN).toPromise();

            expect(columns).toEqual([{ fieldName: COLUMN_FIELD, state: "selected", position: 2 }]);
        });
    });
});

function givenColumnSetting(value: ColumnSettingValue): void {
    const appSettings = AppSettings.defaultSettings("active").updateColumns([{ field: COLUMN_FIELD, value }]);
    when(appSettingsRepositoryMock.get()).thenReturn(Future.success(appSettings));
}

function givenColumnPreferences(columns: Column[]): void {
    when(userColumnRepositoryMock.get()).thenReturn(Future.success(columns));
}

function buildColumn(state: Column["state"], position: number): Column {
    return Column.build({ fieldName: COLUMN_FIELD, state, position }).getOrThrow();
}

function buildUser(authorities: string[]): UserProps {
    return { ...defaultUserProps, authorities };
}
