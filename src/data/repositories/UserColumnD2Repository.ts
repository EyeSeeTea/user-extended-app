import { Future, FutureData } from "../../domain/entities/Future";
import { Column } from "../../domain/entities/UserColumn";
import { UserColumnRepository } from "../../domain/repositories/UserColumnRepository";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { StorageClient } from "../clients/storage/StorageClient";
import { Instance } from "../entities/Instance";
import { Namespaces } from "../clients/storage/Namespaces";
import { defaultColumns } from "./UserD2ApiRepository";
import { User } from "../../domain/entities/User";

export class UserColumnD2Repository implements UserColumnRepository {
    private userStorage: StorageClient;

    constructor(instance: Instance) {
        this.userStorage = new DataStoreStorageClient("user", instance);
    }

    get(): FutureData<Column[]> {
        const $request = this.userStorage.getObject<Array<keyof User>>(Namespaces.VISIBLE_COLUMNS);
        const $requestPreference = this.userStorage.getObject<Column[]>(Namespaces.COLUMNS_PREFERENCE);

        return Future.joinObj({
            oldColumns: $request,
            columns: $requestPreference,
        }).map(({ oldColumns, columns }) => {
            if (columns && columns.length > 0) {
                return columns.map((col, index) =>
                    Column.build({ ...col, position: col.position ?? index }).getOrThrow()
                );
            } else if (oldColumns && oldColumns.length > 0) {
                return this.buildColumnsFromIds(oldColumns);
            } else {
                return this.buildColumnsFromIds(defaultColumns);
            }
        });
    }

    save(columns: Column[]): FutureData<void> {
        return this.userStorage.saveObject(Namespaces.COLUMNS_PREFERENCE, columns);
    }

    private buildColumnsFromIds(columnIds: Array<keyof User>): Column[] {
        return columnIds.map((colId, index) =>
            Column.build({ fieldName: colId, state: "selected", position: index }).getOrThrow()
        );
    }
}
