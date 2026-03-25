import { FutureData } from "../../domain/entities/Future";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { StorageClient } from "../clients/storage/StorageClient";
import { Instance } from "../entities/Instance";
import { Namespaces } from "../clients/storage/Namespaces";
import { GroupColumnSetting, GroupColumnType } from "../../domain/entities/GroupColumn";
import { GroupColumnRepository } from "../../domain/repositories/GroupColumnRepository";

export class GroupColumnD2Repository implements GroupColumnRepository {
    private userStorage: StorageClient;

    constructor(instance: Instance) {
        this.userStorage = new DataStoreStorageClient("user", instance);
    }

    get(): FutureData<GroupColumnSetting[]> {
        return this.userStorage.getObject<GroupColumnSetting[]>(Namespaces.GROUPS_COLUMNS_PREFERENCE).map(columns => {
            if (columns && columns.length > 0) {
                return columns.map((col, index) => ({ ...col, position: col.position ?? index }));
            } else {
                return this.buildColumnsFromIds(["name", "users"]);
            }
        });
    }

    save(columns: GroupColumnSetting[]): FutureData<void> {
        return this.userStorage.saveObject(Namespaces.GROUPS_COLUMNS_PREFERENCE, columns);
    }

    private buildColumnsFromIds(columnIds: GroupColumnType[]): GroupColumnSetting[] {
        return columnIds.map((colId, index) => ({ fieldName: colId, state: "selected", position: index }));
    }
}
