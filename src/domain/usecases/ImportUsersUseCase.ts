import _ from "lodash";
import { Future, FutureData } from "../entities/Future";
import { UserProps, defaultUserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";
import { UseCase } from "../../CompositionRoot";
import i18n from "../../utils/i18n";
import { User } from "../entities/User";
import { getLanguage } from "../utils/getLanguage";
import { isUniqueOpenId } from "../utils/isUniqueOpenId";
import { IMPORT_USERS_CHUNK_SIZE } from "../utils/limits";

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
        // Global validations before chunking to avoid repeated checks and silent drops
        if (!isUniqueOpenId(users)) return Future.error(i18n.t("Open IDs must be unique"));

        const usernames = users.map(u => u.username);
        const hasDuplicatedUsernames = _.uniq(usernames).length !== usernames.length;
        if (hasDuplicatedUsernames) return Future.error(i18n.t("Usernames must be unique"));

        return this.userRepository
            .getCurrent()
            .flatMap(currentUser => {
                return Future.sequential(
                    _.chunk(users, IMPORT_USERS_CHUNK_SIZE).map(userChunk => {
                        const usernameList = userChunk.map(user => user.username);

                        return this.userRepository
                            .listAll({
                                onlyActiveUsers: false,
                                onlyUsersOrgUnits: false,
                                hideUsers: [],
                                filters: { username: usernameList },
                            })
                            .flatMap(usersFromDB => {
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
                return User.createExisted({
                    ...dbUser,
                    ...user,
                    name: `${user.firstName} ${user.surname}`,
                    lastModifiedBy: { id, username },
                    dbLocale: dbUser.dbLocale,
                    uiLocale: dbUser.uiLocale,
                }).getOrThrow();
            }
            return User.createNew({
                ...defaultUserProps,
                ...user,
                name: `${user.firstName} ${user.surname}`,
                createdBy: { id, username },
                lastModifiedBy: { id, username },
                dbLocale: getLanguage(user.dbLocale),
                uiLocale: getLanguage(user.uiLocale),
            }).getOrThrow();
        });
    }

    private saveUsers(users: User[]): FutureData<void> {
        return this.userRepository.save(users).toVoid();
    }
}

export type ImportUsersUseCaseOptions = { users: UserProps[] };
