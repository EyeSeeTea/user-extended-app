import { afterAll, vi } from "vitest";
import { instance, mock, when, verify, deepEqual } from "ts-mockito";
import { UserProps } from "../../entities/UserProps";
import { User } from "../../entities/User";
import { ExportUsersUseCase, ExportUsersUseCaseOptions } from "../ExportUsersUseCase";
import { Future } from "../../entities/Future";
import moment from "moment";
import { UserD2ApiRepository } from "../../../data/repositories/UserD2ApiRepository";
import {
    columnsAvailableToExport,
    emptyCSVBlob,
    userToExport,
    usersExportCSVBlob,
    usersExportJSONBlob,
} from "./data/usersExport";

let userRepositoryMock: UserD2ApiRepository;
let exportUsersUseCase: ExportUsersUseCase;

// NOTE: Only fake Date so moment() returns a fixed time for the filename. If we fake all timers,
// FileReader (used in readBlobAsText) never fires onload and the test times out.
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

describe("ExportUsersUseCase", () => {
    beforeEach(() => {
        userRepositoryMock = mock(UserD2ApiRepository);
        exportUsersUseCase = new ExportUsersUseCase(instance(userRepositoryMock));
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
        givenUsersToExport();
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
        givenUsersToExport();
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
});

afterAll(() => {
    vi.useRealTimers();
});

const filterOptions = {
    onlyActiveUsers: false,
    onlyUsersOrgUnits: false,
    hideUsers: [],
};

function givenUsersToExport(): void {
    const users = [userToExport as UserProps];
    when(
        userRepositoryMock.listAll(
            deepEqual({
                onlyActiveUsers: false,
                onlyUsersOrgUnits: false,
                hideUsers: [],
            })
        )
    ).thenReturn(Future.success(users.map(u => User.createExisted(u).getOrThrow())));
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
