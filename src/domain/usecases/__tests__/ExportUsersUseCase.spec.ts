import { afterAll, vi } from "vitest";
import { instance, mock, when, verify, deepEqual } from "ts-mockito";
import { UserProps } from "../../entities/UserProps";
import { User } from "../../entities/User";
import { ExportUsersUseCase, ExportUsersUseCaseOptions } from "../ExportUsersUseCase";
import { Future } from "../../entities/Future";
import moment from "moment";
import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";
import { AppSettingsD2Repository } from "../../../data/repositories/AppSettingsD2Repository";
import { AppSettings } from "../../entities/AppSettings";
import { ListOptions } from "../../repositories/UserRepository";
import {
    columnsAvailableToExport,
    emptyCSVBlob,
    userToExport,
    usersExportCSVBlob,
    usersExportJSONBlob,
} from "./data/usersExport";

let userRepositoryMock: UserD2ApiRepository;
let appSettingsRepositoryMock: AppSettingsD2Repository;
let exportUsersUseCase: ExportUsersUseCase;

// NOTE: Only fake Date so moment() returns a fixed time for the filename. If we fake all timers,
// FileReader (used in readBlobAsText) never fires onload and the test times out.
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

describe("ExportUsersUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        appSettingsRepositoryMock = mock(AppSettingsD2Repository);
        exportUsersUseCase = new ExportUsersUseCase(instance(userRepositoryMock), instance(appSettingsRepositoryMock));
        givenCurrentUser(NON_SUPER_ADMIN_AUTHORITIES);
        givenHiddenUsers([]);
    });

    it("should return an empty template when isEmptyTemplate is true", async () => {
        const options: ExportUsersUseCaseOptions = {
            name: "empty-template",
            columns: columnsAvailableToExport,
            format: "csv",
            orgUnitsField: "code",
            isEmptyTemplate: true,
            filterOptions: filterOptions,
        };

        const { blob, filename } = await exportUsersUseCase.execute(options).toPromise();

        const expectedFilename = `empty-template-${moment().format("YYYY-MM-DD_HH-mm")}`;
        expect(filename.startsWith(expectedFilename)).toBe(true);
        // Compare Blob content
        expect(await readBlobAsText(blob)).toEqual(await readBlobAsText(emptyCSVBlob));
        verify(userRepositoryMock.listAll(filterOptions)).never();
    });

    it("should return a blob and filename when exporting users with CSV format", async () => {
        givenUsersToExport(filterOptions);
        const options: ExportUsersUseCaseOptions = {
            name: "users",
            columns: columnsAvailableToExport,
            format: "csv",
            orgUnitsField: "code",
            filterOptions: filterOptions,
            isEmptyTemplate: false,
        };

        const { blob, filename } = await exportUsersUseCase.execute(options).toPromise();

        const expectedFilename = `users-${moment().format("YYYY-MM-DD_HH-mm")}`;
        expect(filename.startsWith(expectedFilename)).toBe(true);
        // Compare Blob content
        expect(await readBlobAsText(blob)).toEqual(await readBlobAsText(usersExportCSVBlob));
        verify(userRepositoryMock.listAll(deepEqual(filterOptions))).once();
    });

    it("should return a blob and filename when exporting users with JSON format", async () => {
        givenUsersToExport(filterOptions);
        const options: ExportUsersUseCaseOptions = {
            name: "users",
            columns: columnsAvailableToExport,
            format: "json",
            orgUnitsField: "code",
            filterOptions: filterOptions,
            isEmptyTemplate: false,
        };

        const { blob, filename } = await exportUsersUseCase.execute(options).toPromise();

        const expectedFilename = `users-${moment().format("YYYY-MM-DD_HH-mm")}`;
        expect(filename.startsWith(expectedFilename)).toBe(true);
        // Compare Blob content
        expect(await readBlobAsText(blob)).toEqual(await readBlobAsText(usersExportJSONBlob));
        verify(userRepositoryMock.listAll(deepEqual(filterOptions))).once();
    });

    describe("hidden users in app settings", () => {
        it("should exclude them when the current user is not a super admin", async () => {
            givenCurrentUser(NON_SUPER_ADMIN_AUTHORITIES);
            givenHiddenUsers(HIDDEN_USER_IDS);
            const expectedOptions = { ...filterOptions, hideUsers: HIDDEN_USER_IDS };
            givenUsersToExport(expectedOptions);

            await exportUsersUseCase.execute(exportOptions).toPromise();

            verify(userRepositoryMock.listAll(deepEqual(expectedOptions))).once();
        });

        it("should not exclude them when the current user is a super admin", async () => {
            givenCurrentUser(SUPER_ADMIN_AUTHORITIES);
            givenHiddenUsers(HIDDEN_USER_IDS);
            const expectedOptions = { ...filterOptions, hideUsers: [] };
            givenUsersToExport(expectedOptions);

            await exportUsersUseCase.execute(exportOptions).toPromise();

            verify(userRepositoryMock.listAll(deepEqual(expectedOptions))).once();
        });
    });
});

afterAll(() => {
    vi.useRealTimers();
});

const filterOptions: ListOptions = {
    onlyActiveUsers: false,
    onlyUsersOrgUnits: false,
    hideUsers: [],
};

const exportOptions: ExportUsersUseCaseOptions = {
    name: "users",
    columns: columnsAvailableToExport,
    format: "csv",
    orgUnitsField: "code",
    filterOptions: filterOptions,
    isEmptyTemplate: false,
};

const SUPER_ADMIN_AUTHORITIES = ["ALL"];
const NON_SUPER_ADMIN_AUTHORITIES = ["F_USER_ADD"];
const HIDDEN_USER_IDS = ["hidden-user-id"];

function givenUsersToExport(expectedOptions: ListOptions): void {
    const users = [userToExport as UserProps];
    when(userRepositoryMock.listAll(deepEqual(expectedOptions))).thenReturn(
        Future.success(users.map(u => User.createExisted(u).getOrThrow()))
    );
}

function givenCurrentUser(authorities: string[]): void {
    const currentUser = User.createExisted({ ...(userToExport as UserProps), authorities }).getOrThrow();
    when(userRepositoryMock.getCurrent()).thenReturn(Future.success(currentUser));
}

function givenHiddenUsers(userIds: string[]): void {
    const appSettings = AppSettings.defaultSettings("active");
    const settingsWithHiddenUsers = AppSettings.create({
        ...appSettings,
        hide: { ...appSettings.hide, users: userIds },
    });
    when(appSettingsRepositoryMock.get()).thenReturn(Future.success(settingsWithHiddenUsers));
}

/**
 * Reads the content of a Blob as a text string.
 */
function readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}
