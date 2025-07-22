import _ from "lodash";
import { Future, FutureData } from "../entities/Future";
import { UserProps, defaultUserProps } from "../entities/UserProps";
import { UserRepository } from "../repositories/UserRepository";
import { UseCase } from "../../CompositionRoot";
import { generateUid } from "../../utils/uid";
import { User } from "../entities/User";
import i18n from "../../locales";

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
        const usernameList = users.map(user => user.username);
        return Future.joinObj({
            usersFromDB: this.userRepository.listAll({ filters: { "userCredentials.username": ["in", usernameList] } }),
            currentUser: this.userRepository.getCurrent(),
        }).flatMap(({ usersFromDB, currentUser }) => {
            if (!User.validateUniqueOpenId(users)) return Future.error(i18n.t("Open IDs must be unique"));

            const hasRequiredFields = User.validateHasRequiredFields(users);
            if (!hasRequiredFields)
                return Future.error("All users must have at least one Organisation Unit, Role and Group");

            const hasDuplicatedUsernames = _.uniq(usernameList).length !== usernameList.length;
            if (hasDuplicatedUsernames) return Future.error("Usernames must be unique");

            const mergedUsers = this.mergeUsers(users, usersFromDB, currentUser);
            return this.saveUsers(mergedUsers);
        });
    }

    private mergeUsers(
        users: UserProps[],
        usersFromDB: UserProps[],
        { id, username }: UserProps = defaultUserProps
    ): UserProps[] {
        const usersFromDBMap = _.keyBy(usersFromDB, key => key.username);
        // Merge properties from usersFromDB into users
        return users.map((userFromImport): UserProps => {
            const user = _.pick(userFromImport, Object.keys(columnNameFromPropertyMapping));
            const dbUser = _.find(usersFromDBMap, userFromDB => userFromDB.username === user.username);
            if (dbUser) {
                // Merge user with dbUser, but do not overwrite existing properties in user
                return {
                    ...dbUser,
                    ...user,
                    name: `${user.firstName} ${user.surname}`,
                    lastModifiedBy: { id, username },
                    dbLocale: User.setDefaultLanguage(dbUser.dbLocale),
                    uiLocale: User.setDefaultLanguage(dbUser.uiLocale),
                };
            }
            return {
                ...defaultUserProps,
                ...user,
                id: generateUid(),
                name: `${user.firstName} ${user.surname}`,
                createdBy: { id, username },
                lastModifiedBy: { id, username },
                dbLocale: User.setDefaultLanguage(user.dbLocale),
                uiLocale: User.setDefaultLanguage(user.uiLocale),
            };
        });
    }

    private saveUsers(users: UserProps[]): FutureData<void> {
        return this.userRepository.save(users).toVoid();
    }
}

export type ImportUsersUseCaseOptions = { users: UserProps[] };
