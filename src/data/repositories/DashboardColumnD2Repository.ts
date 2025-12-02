import { FutureData } from "../../domain/entities/Future";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { StorageClient } from "../clients/storage/StorageClient";
import { Instance } from "../entities/Instance";
import { Namespaces } from "../clients/storage/Namespaces";
import { DashboardColumnRepository } from "../../domain/repositories/DashboardColumnRepository";
import { DashboardColumnSetting, DashboardColumnType } from "../../domain/entities/DashboardColumn";

export class DashboardColumnD2Repository implements DashboardColumnRepository {
    private userStorage: StorageClient;

    constructor(instance: Instance) {
        this.userStorage = new DataStoreStorageClient("user", instance);
    }

    get(): FutureData<DashboardColumnSetting[]> {
        return this.userStorage
            .getObject<DashboardColumnSetting[]>(Namespaces.DASHBOARD_COLUMNS_PREFERENCE)
            .map(columns => {
                if (columns && columns.length > 0) {
                    return columns.map((col, index) => ({ ...col, position: col.position ?? index }));
                } else {
                    return this.buildColumnsFromIds(["name", "description", "owner", "users"]);
                }
            });
    }

    save(columns: DashboardColumnSetting[]): FutureData<void> {
        return this.userStorage.saveObject(Namespaces.DASHBOARD_COLUMNS_PREFERENCE, columns);
    }

    private buildColumnsFromIds(columnIds: DashboardColumnType[]): DashboardColumnSetting[] {
        return columnIds.map((colId, index) => ({ fieldName: colId, state: "selected", position: index }));
    }
}
