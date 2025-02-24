import { Instance } from "./data/entities/Instance";
import { InstanceD2ApiRepository } from "./data/repositories/InstanceD2ApiRepository";
import { MetadataD2ApiRepository } from "./data/repositories/MetadataD2ApiRepository";
import { UserD2ApiRepository } from "./data/repositories/UserD2ApiRepository";
import { ExportUsersUseCase } from "./domain/usecases/ExportUsersUseCase";
import { GetColumnsUseCase } from "./domain/usecases/GetColumnsUseCase";
import { GetCurrentUserUseCase } from "./domain/usecases/GetCurrentUserUseCase";
import { GetInstanceLocalesUseCase } from "./domain/usecases/GetInstanceLocalesUseCase";
import { GetInstanceVersionUseCase } from "./domain/usecases/GetInstanceVersionUseCase";
import { GetOrgUnitPathsUseCase } from "./domain/usecases/GetOrgUnitPathsUseCase";
import { GetUsersByIdsUseCase } from "./domain/usecases/GetUsersByIdsUseCase";
import { ListAllUserIdsUseCase } from "./domain/usecases/ListAllUserIdsUseCase";
import { ListMetadataUseCase } from "./domain/usecases/ListMetadataUseCase";
import { ListUsersUseCase } from "./domain/usecases/ListUsersUseCase";
import { ListAllUsersUseCase } from "./domain/usecases/ListAllUsersUseCase";
import { RemoveUsersUseCase } from "./domain/usecases/RemoveUsersUseCase";
import { SaveColumnsUseCase } from "./domain/usecases/SaveColumnsUseCase";
import { SaveUserOrgUnitUseCase } from "./domain/usecases/SaveUserOrgUnitUseCase";
import { SaveUserStatusUseCase } from "./domain/usecases/SaveUserStatusUseCase";
import { SaveUsersUseCase } from "./domain/usecases/SaveUsersUseCase";
import { UpdateUserPropUseCase } from "./domain/usecases/UpdateUserPropUseCase";
import { CopyInUserUseCase } from "./domain/usecases/CopyInUserUseCase";
import { ImportUsersUseCase } from "./domain/usecases/ImportUsersUseCase";
import { GetProgramsUseCase } from "./domain/usecases/GetProgramsUseCase";
import { ProgramD2Repository } from "./data/repositories/ProgramD2Repository";
import { getD2APiFromInstance } from "./utils/d2-api";
import { LoggerSettingsD2Repository } from "./data/repositories/LoggerSettingsD2Repository";
import { GetLoggerSettingsUseCase } from "./domain/usecases/GetLoggerSettingsUseCase";
import { SaveLoggerSettingsUseCase } from "./domain/usecases/SaveLoggerSettingsUseCase";
import { GetAppSettingsUseCase } from "./domain/usecases/GetAppSettingsUseCase";
import { AppSettingsD2Repository } from "./data/repositories/AppSettingsD2Repository";
import { SaveAppSettingsUseCase } from "./domain/usecases/SaveAppSettingsUseCase";
import { ResetUsersPasswordsUseCase } from "./domain/usecases/ResetUsersPasswordsUseCase";
import { SearchUsersAndUserGroupsUseCase } from "./domain/usecases/SearchUsersAndUserGroupsUseCase";
import { UserSearchD2Repository } from "./data/repositories/UserSearchD2Repository";
import { CheckCurrentUserCanAccessSettingsUseCase } from "./domain/usecases/CheckCurrentUserCanAccessSettingsUseCase";
import { UserGroupD2Repository } from "./data/repositories/UserGroupD2Repository";
import { GetAllUserGroupsUseCase } from "./domain/usecases/GetAllUserGroupsUseCase";
import { CheckActionsAccessibleToCurrentUserUseCase } from "./domain/usecases/CheckActionsAccessibleToCurrentUserUseCase";
import { GetAllUserRolesUseCase } from "./domain/usecases/GetAllUserRolesUseCase";
import { UserRoleD2Repository } from "./data/repositories/UserRoleD2Repository";

export function getCompositionRoot(instance: Instance) {
    const api = getD2APiFromInstance(instance);
    const instanceRepository = new InstanceD2ApiRepository(instance);
    const userRepository = new UserD2ApiRepository(instance);
    const metadataRepository = new MetadataD2ApiRepository(instance);
    const programRepository = new ProgramD2Repository(api);
    const loggerSettingsRepository = new LoggerSettingsD2Repository(instance);
    const appSettingsRepository = new AppSettingsD2Repository(api);
    const userAndUserGroupsSearchRepository = new UserSearchD2Repository(api);
    const userGroupRepository = new UserGroupD2Repository(api);
    const userRoleRepository = new UserRoleD2Repository(api);

    return {
        logger: {
            get: new GetLoggerSettingsUseCase(loggerSettingsRepository),
            save: new SaveLoggerSettingsUseCase(loggerSettingsRepository),
        },
        programs: { get: new GetProgramsUseCase(programRepository) },
        instance: getExecute({
            getVersion: new GetInstanceVersionUseCase(instanceRepository),
            getLocales: new GetInstanceLocalesUseCase(instanceRepository),
        }),
        users: getExecute({
            getCurrent: new GetCurrentUserUseCase(userRepository),
            list: new ListUsersUseCase(userRepository),
            listAll: new ListAllUsersUseCase(userRepository),
            listAllIds: new ListAllUserIdsUseCase(userRepository),
            get: new GetUsersByIdsUseCase(userRepository),
            save: new SaveUsersUseCase(userRepository),
            saveStatus: new SaveUserStatusUseCase(userRepository),
            updateProp: new UpdateUserPropUseCase(userRepository),
            getColumns: new GetColumnsUseCase(userRepository),
            saveColumns: new SaveColumnsUseCase(userRepository),
            remove: new RemoveUsersUseCase(userRepository),
            saveOrgUnits: new SaveUserOrgUnitUseCase(userRepository),
            export: new ExportUsersUseCase(userRepository),
            copyInUser: new CopyInUserUseCase(userRepository),
            import: new ImportUsersUseCase(userRepository),
            resetPasswords: new ResetUsersPasswordsUseCase(userRepository),
            searchUsersAndGroups: new SearchUsersAndUserGroupsUseCase(userAndUserGroupsSearchRepository),
            checkCurrentUserCanAccessSettings: new CheckCurrentUserCanAccessSettingsUseCase(
                userRepository,
                appSettingsRepository
            ),
            checkActionsAccessibleToCurrentUser: new CheckActionsAccessibleToCurrentUserUseCase(),
        }),
        userGroups: getExecute({
            getAll: new GetAllUserGroupsUseCase(userGroupRepository),
        }),
        userRoles: getExecute({
            getAll: new GetAllUserRolesUseCase(userRoleRepository),
        }),
        metadata: getExecute({
            list: new ListMetadataUseCase(metadataRepository),
            getOrgUnitPaths: new GetOrgUnitPathsUseCase(metadataRepository),
        }),
        settings: {
            get: new GetAppSettingsUseCase(appSettingsRepository),
            save: new SaveAppSettingsUseCase(appSettingsRepository),
        },
    };
}

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

function getExecute<UseCases extends Record<Key, UseCase>, Key extends keyof UseCases>(
    useCases: UseCases
): { [K in Key]: UseCases[K]["execute"] } {
    const keys = Object.keys(useCases) as Key[];
    const initialOutput = {} as { [K in Key]: UseCases[K]["execute"] };

    return keys.reduce((output, key) => {
        const useCase = useCases[key];
        const execute = useCase.execute.bind(useCase) as UseCases[typeof key]["execute"];
        output[key] = execute;
        return output;
    }, initialOutput);
}

export interface UseCase {
    execute: Function;
}
