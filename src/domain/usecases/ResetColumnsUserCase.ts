import { UseCase } from "../../CompositionRoot";
import { AppSettings } from "../entities/AppSettings";
import { FutureData } from "../entities/Future";
import { UserColumns } from "../entities/User";
import { Column } from "../entities/UserColumn";
import { UserColumnRepository } from "../repositories/UserColumnRepository";

export class ResetColumnsUserCase implements UseCase {
    constructor(private userColumnRepository: UserColumnRepository) {}

    execute(appSettings: AppSettings): FutureData<UserColumns[]> {
        const columns = appSettings.columns.map((columnConfig, index): Column => {
            return Column.build({
                fieldName: columnConfig.field,
                state: this.convertValueToState(columnConfig.value),
                position: index,
            }).getOrThrow();
        });

        return this.userColumnRepository.save(columns).map(() => columns.map(col => col.fieldName));
    }

    private convertValueToState(value: string): Column["state"] {
        switch (value) {
            case "visible":
                return "selected";
            case "disabled":
                return "unselected";
            case "mandatory":
                return "selected-disabled";
            default:
                return "unselected";
        }
    }
}
