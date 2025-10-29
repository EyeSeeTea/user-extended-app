import { Instance } from "./data/entities/Instance";
import { InstanceD2ApiRepository } from "./data/repositories/InstanceD2ApiRepository";
import { MetadataD2ApiRepository } from "./data/repositories/MetadataD2ApiRepository";
import { UserD2ApiRepository } from "./data/repositories/UserD2ApiRepository";
import { ExportUsersUseCase } from "./domain/usecases/ExportUsersUseCase";
import { GetCurrentUserUseCase } from "./domain/usecases/GetCurrentUserUseCase";
import { GetInstanceLocalesUseCase } from "./domain/usecases/GetInstanceLocalesUseCase";
import { GetInstanceVersionUseCase } from "./domain/usecases/GetInstanceVersionUseCase";
import { GetOrgUnitPathsUseCase } from "./domain/usecases/GetOrgUnitPathsUseCase";
import { GetUsersByIdsUseCase } from "./domain/usecases/GetUsersByIdsUseCase";
import { ListMetadataUseCase } from "./domain/usecases/ListMetadataUseCase";
import { ListUsersUseCase } from "./domain/usecases/ListUsersUseCase";
import { ListAllUsersUseCase } from "./domain/usecases/ListAllUsersUseCase";
import { ListAllUserIdentifiersUseCase } from "./domain/usecases/ListAllUserIdentifiersUseCase";
import { RemoveUsersUseCase } from "./domain/usecases/RemoveUsersUseCase";
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
import { GetAllUserRolesUseCase } from "./domain/usecases/GetAllUserRolesUseCase";
import { UserRoleD2Repository } from "./data/repositories/UserRoleD2Repository";
import { GetDashboardsUseCase } from "./domain/usecases/GetDashboardsUseCase";
import { DashboardD2Repository } from "./data/repositories/DashboardD2Repository";
import { GetUserRolesUseCase } from "./domain/usecases/GetUserRolesUseCase";
import { OrgUnitD2Repository } from "./data/repositories/OrgUnitD2Repository";
import { GetUserGroupsUseCase } from "./domain/usecases/GetUserGroupsUseCase";
import { GetUsersInOrgUnits } from "./domain/usecases/GetUsersInOrgUnits";
import { UserSimpleD2Repository } from "./data/repositories/UserSimpleD2Repository";
import { AppSettingsD2ConstantRepository } from "./data/repositories/AppSettingsD2ConstantRepository";
import { SetUserPasswordUseCase } from "./domain/usecases/SetUserPasswordUseCase";
import { VerifyPasswordUseCase } from "./domain/usecases/VerifyPasswordUseCase";
import { ResetColumnsUserCase } from "./domain/usecases/ResetColumnsUserCase";
import { ReplicateFromTemplateUseCase } from "./domain/usecases/ReplicateFromTemplateUseCase";
import { GetColumnsPreferencesUseCase } from "./domain/usecases/GetColumnsPreferencesUseCase";
import { UserColumnD2Repository } from "./data/repositories/UserColumnD2Repository";
import { SaveColumnsPreferenceUseCase } from "./domain/usecases/SaveColumnsPreferenceUseCase";

export type SettingsStorageType = "dataStore" | "constants";

export function getCompositionRoot(instance: Instance, storageType: SettingsStorageType) {
    const api = getD2APiFromInstance(instance);
    const instanceRepository = new InstanceD2ApiRepository(instance);
    const userRepository = new UserD2ApiRepository(instance);
    const metadataRepository = new MetadataD2ApiRepository(instance);
    const programRepository = new ProgramD2Repository(api);
    const loggerSettingsRepository = new LoggerSettingsD2Repository(instance);
    const appSettingsRepository =
        storageType === "dataStore" ? new AppSettingsD2Repository(api) : new AppSettingsD2ConstantRepository(api);
    const userAndUserGroupsSearchRepository = new UserSearchD2Repository(api);
    const userGroupRepository = new UserGroupD2Repository(api);
    const userRoleRepository = new UserRoleD2Repository(api);
    const dashboardRepository = new DashboardD2Repository(api);
    const orgUnitRepository = new OrgUnitD2Repository(api);
    const userSimpleRepository = new UserSimpleD2Repository(api);
    const userColumnRepository = new UserColumnD2Repository(instance);

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
            list: new ListUsersUseCase(userRepository, appSettingsRepository),
            listAll: new ListAllUsersUseCase(userRepository),
            listAllIdentifiers: new ListAllUserIdentifiersUseCase(userRepository, appSettingsRepository),
            get: new GetUsersByIdsUseCase(userRepository),
            save: new SaveUsersUseCase(userRepository),
            saveStatus: new SaveUserStatusUseCase(userRepository),
            updateProp: new UpdateUserPropUseCase(userRepository),
            getColumns: new GetColumnsPreferencesUseCase(userColumnRepository, appSettingsRepository),
            saveColumns: new SaveColumnsPreferenceUseCase(userColumnRepository),
            remove: new RemoveUsersUseCase(userRepository),
            saveOrgUnits: new SaveUserOrgUnitUseCase(userRepository),
            export: new ExportUsersUseCase(userRepository),
            copyInUser: new CopyInUserUseCase(userRepository),
            import: new ImportUsersUseCase(userRepository),
            resetPasswords: new ResetUsersPasswordsUseCase(userRepository),
            verifyPassword: new VerifyPasswordUseCase(userRepository),
            setPassword: new SetUserPasswordUseCase(userRepository),
            searchUsersAndGroups: new SearchUsersAndUserGroupsUseCase(userAndUserGroupsSearchRepository),
            checkCurrentUserCanAccessSettings: new CheckCurrentUserCanAccessSettingsUseCase(
                userRepository,
                appSettingsRepository
            ),
            getInOrgUnits: new GetUsersInOrgUnits(orgUnitRepository, userSimpleRepository, appSettingsRepository),
            resetColumns: new ResetColumnsUserCase(userColumnRepository),
            replicateFromTemplate: new ReplicateFromTemplateUseCase(userRepository),
        }),
        userGroups: getExecute({
            getAll: new GetAllUserGroupsUseCase(userGroupRepository),
            get: new GetUserGroupsUseCase(userGroupRepository, orgUnitRepository, appSettingsRepository),
        }),
        userRoles: getExecute({
            get: new GetUserRolesUseCase(userRoleRepository, orgUnitRepository, appSettingsRepository),
            getAll: new GetAllUserRolesUseCase(userRoleRepository),
            replicateFromTemplate: new ReplicateFromTemplateUseCase(userRepository),
        }),
        metadata: getExecute({
            list: new ListMetadataUseCase(metadataRepository),
            getOrgUnitPaths: new GetOrgUnitPathsUseCase(metadataRepository),
        }),
        settings: {
            get: new GetAppSettingsUseCase(appSettingsRepository),
            save: new SaveAppSettingsUseCase(appSettingsRepository),
        },
        dashboards: {
            get: new GetDashboardsUseCase(dashboardRepository, appSettingsRepository),
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
