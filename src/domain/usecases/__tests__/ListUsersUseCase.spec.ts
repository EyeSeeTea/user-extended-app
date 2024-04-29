import { Future, FutureData } from "../../entities/Future";
import { PaginatedResponse } from "../../entities/PaginatedResponse";
import { User } from "../../entities/User";
import { ListOptions, UserRepository } from "../../repositories/UserRepository";
import { ListUsersUseCase } from "../ListUsersUseCase";
import { users } from "./userFixtures";

// Manual Test Double

describe("List Users", () => {
    it("objects property should return a list of users", async () => {
        const useCase = givenAListOfUsers();
        const noOptions = {};

        const response = await useCase
            .execute(noOptions)
            .map(data => data.objects)
            .runAsync();
        const result = response.data;

        expect(result).toBe(users);
        return;
    });

    it("pager property should return a pager object", async () => {
        const useCase = givenAPager();
        const noOptions = {};

        const response = await useCase
            .execute(noOptions)
            .map(data => data.pager)
            .runAsync();
        const result = response.data;

        expect(result).toEqual({ page: 1, pageCount: 1, total: 0, pageSize: 10 });
        return;
    });

    it("should return a list of users that match a search term", async () => {
        const useCase = givenAListOfUsersBySearchOption();
        const options = { search: "Alain Traore" };

        const response = await useCase
            .execute(options)
            .map(data => data.objects)
            .runAsync();
        const result = response.data;

        expect(result?.length).toBe(1);
        return;
    });

    it("should return an empty list if no users match the search term", async () => {
        const useCase = givenAListOfUsersBySearchOption();
        const options = { search: "Non-existent User" };

        const response = await useCase
            .execute(options)
            .map(data => data.objects)
            .runAsync();
        const result = response.data;

        expect(result).toEqual([]);
        return;
    });

    it("should return 5 users when pageSize is set to 5", async () => {
        const useCase = givenAListOfUsersWithPageSizeOption();
        const options = { pageSize: 5 };

        const response = await useCase.execute(options).runAsync();
        const result = response.data;

        expect(result?.objects?.length).toBe(5);
        expect(result?.pager.pageSize).toBe(5);
        return;
    });
});

const meaninglessPager = { page: 0, pageCount: 0, total: 0, pageSize: 0 };

function givenAListOfUsers() {
    class UserStubRepository {
        list(_options: ListOptions): FutureData<PaginatedResponse<User>> {
            return Future.success({ objects: users, pager: meaninglessPager });
        }
    }

    return new ListUsersUseCase(new UserStubRepository() as UserRepository);
}

function givenAListOfUsersWithPageSizeOption() {
    class UserStubRepository {
        list(options: ListOptions): FutureData<PaginatedResponse<User>> {
            return Future.success({
                objects: users.slice(-(options.pageSize ?? 0)),
                pager: { page: 1, pageCount: 5, total: 25, pageSize: options.pageSize ?? 0 },
            });
        }
    }

    return new ListUsersUseCase(new UserStubRepository() as UserRepository);
}

function givenAPager() {
    class UserStubRepository {
        list(_options: ListOptions): FutureData<PaginatedResponse<User>> {
            return Future.success({ objects: [], pager: { page: 1, pageCount: 1, total: 0, pageSize: 10 } });
        }
    }

    return new ListUsersUseCase(new UserStubRepository() as UserRepository);
}

function givenAListOfUsersBySearchOption() {
    class UserStubRepository {
        list(options: ListOptions): FutureData<PaginatedResponse<User>> {
            return Future.success({
                objects: users.filter(user => user.name.includes(options.search || "")),
                pager: meaninglessPager,
            });
        }
    }

    return new ListUsersUseCase(new UserStubRepository() as UserRepository);
}
