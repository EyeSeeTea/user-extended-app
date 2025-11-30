import { FutureData } from "../../domain/entities/Future";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { StorageClient } from "../clients/storage/StorageClient";
import { Instance } from "../entities/Instance";
import { Namespaces } from "../clients/storage/Namespaces";
import { RoleColumnRepository } from "../../domain/repositories/RoleColumnRepository";
import { RoleColumnSetting, RoleColumnType } from "../../domain/entities/RoleColumn";

export class RoleColumnD2Repository implements RoleColumnRepository {
    private userStorage: StorageClient;

    constructor(instance: Instance) {
        this.userStorage = new DataStoreStorageClient("user", instance);
    }

    get(): FutureData<RoleColumnSetting[]> {
        return this.userStorage.getObject<RoleColumnSetting[]>(Namespaces.ROLE_COLUMNS_PREFERENCE).map(columns => {
            if (columns && columns.length > 0) {
                return columns.map((col, index) => ({ ...col, position: col.position ?? index }));
            } else {
                return this.buildColumnsFromIds(["name", "description", "users"]);
            }
        });
    }

    save(columns: RoleColumnSetting[]): FutureData<void> {
        return this.userStorage.saveObject(Namespaces.ROLE_COLUMNS_PREFERENCE, columns);
    }

    private buildColumnsFromIds(columnIds: RoleColumnType[]): RoleColumnSetting[] {
        return columnIds.map((colId, index) => ({ fieldName: colId, state: "selected", position: index }));
    }
}
