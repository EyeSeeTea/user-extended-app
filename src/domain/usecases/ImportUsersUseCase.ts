import _ from "lodash";
import { Future, FutureData } from "../entities/Future";
import { UserProps, defaultUserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";
import { UseCase } from "../../CompositionRoot";
import { generateUid } from "../../utils/uid";
import { User } from "../entities/User";
import i18n from "../../locales";
import { IMPORT_USERS_CHUNK_SIZE } from "../utils/chunk";

const columnNameFromPropertyMapping = {
    id: "ID",
    username: "Username",
    password: "Password",
    name: "Name",
    firstName: "First name",
    surname: "Surname",
    email: "Email",
    phoneNumber: "Phone number",
    lastUpdated: "Updated",
    lastLogin: "Last login",
    created: "Created",
    userRoles: "Roles",
    userGroups: "Groups",
    organisationUnits: "OUCapture",
    dataViewOrganisationUnits: "OUOutput",
    searchOrganisationsUnits: "OUSearch",
    disabled: "Disabled",
    openId: "Open ID",
};

export class ImportUsersUseCase implements UseCase {
    constructor(private userRepository: UserRepository) {}

    public execute({ users }: ImportUsersUseCaseOptions): FutureData<void> {
        const uniqueUsers = _.uniqBy(users, user => user.username);

        return this.userRepository
            .getCurrent()
            .flatMap(currentUser => {
                return Future.sequential(
                    _.chunk(uniqueUsers, IMPORT_USERS_CHUNK_SIZE).map(userChunk => {
                        const usernameList = userChunk.map(user => user.username);

                        return this.userRepository
                            .listAll({ filters: { "userCredentials.username": ["in", usernameList] } })
                            .flatMap(usersFromDB => {
                                if (!User.validateUniqueOpenId(users))
                                    return Future.error(i18n.t("Open IDs must be unique"));

                                const hasRequiredFields = User.validateHasRequiredFields(userChunk);
                                if (!hasRequiredFields)
                                    return Future.error(
                                        "All users must have at least one Organisation Unit, Role and Group"
                                    );

                                const hasDuplicatedUsernames = _.uniq(usernameList).length !== usernameList.length;
                                if (hasDuplicatedUsernames) return Future.error("Usernames must be unique");

                                const mergedUsers = this.mergeUsers(userChunk, usersFromDB, currentUser);
                                return this.saveUsers(mergedUsers);
                            });
                    })
                );
            })
            .toVoid();
    }

    private mergeUsers(
        users: UserProps[],
        usersFromDB: UserProps[],
        { id, username }: UserProps = defaultUserProps
    ): User[] {
        const usersFromDBMap = _.keyBy(usersFromDB, key => key.username);
        // Merge properties from usersFromDB into users
        return users.map((userFromImport): User => {
            const user = _.pick(userFromImport, Object.keys(columnNameFromPropertyMapping));
            const dbUser = user.username ? usersFromDBMap[user.username] : undefined;
            if (dbUser) {
                // Merge user with dbUser, but do not overwrite existing properties in user
                return User.createNewUser({
                    ...dbUser,
                    ...user,
                    name: `${user.firstName} ${user.surname}`,
                    lastModifiedBy: { id, username },
                    dbLocale: User.setDefaultLanguage(dbUser.dbLocale),
                    uiLocale: User.setDefaultLanguage(dbUser.uiLocale),
                });
            }
            return User.createNewUser({
                ...defaultUserProps,
                ...user,
                id: generateUid(),
                name: `${user.firstName} ${user.surname}`,
                createdBy: { id, username },
                lastModifiedBy: { id, username },
                dbLocale: User.setDefaultLanguage(user.dbLocale),
                uiLocale: User.setDefaultLanguage(user.uiLocale),
            });
        });
    }

    private saveUsers(users: User[]): FutureData<void> {
        return this.userRepository.save(users).toVoid();
    }
}

export type ImportUsersUseCaseOptions = { users: UserProps[] };
