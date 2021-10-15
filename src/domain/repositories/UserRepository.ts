import { FutureData } from "../entities/Future";
import { PaginatedResponse } from "../entities/PaginatedResponse";
import { User } from "../entities/User";

export interface UserRepository {
    getCurrent(): FutureData<User>;
    list(): FutureData<PaginatedResponse<User>>;
    getById(id: string): FutureData<User>;
    replicateFromTemplate(count: number, usernameTemplate: string, passwordTemplate: string): FutureData<User[]>;
     // newUserFields: [{id, username, password, name, email}]
    replicateFromTable(newUserFields: string[]): FutureData<User[]>;
    update(users: string[]): FutureData<User[]>;
    save(users: string[]): FutureData<User[]>;
    delete(users: string[]): FutureData<void>;
    copyInUser(parents: string[], selectedIds: string[], copyAccessElements: CopyAccessElements, updateStrategy: string):FutureData<User[]>;
    //idk what type allChildren is 
    saveUserGroups(parents: string[], allChildren: string[], selectedIds: string[], updateStrategy: string):FutureData<User[]>;
    saveUserRoles(parents: string[], allChildren: string[], selectedIds: string[], updateStrategy: string):FutureData<User[]>;
    assignToOrgUnits(userIds: string[], field: string, titleKey: string):FutureData<User[]>;
}
interface CopyAccessElements {
    userGroups: boolean;
    userRoles: boolean;
    orgUnitOutput: boolean;
    orgUnitCapture: boolean;
}