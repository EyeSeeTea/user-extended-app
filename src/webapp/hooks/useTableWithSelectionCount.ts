import {
    GetAllIds,
    GetRows,
    ObjectsListProps,
    ReferenceObject,
    TableConfig,
    TableNotification,
    TableSelection,
    TableState,
    useObjectsTable,
} from "@eyeseetea/d2-ui-components";
import _ from "lodash";
import { useCallback, useMemo, useState } from "react";
import i18n from "../../utils/i18n";

export function useTableWithSelectionCount<T extends ReferenceObject>(
    config: TableConfig<T>,
    getRows: GetRows<T>,
    getAllIds?: GetAllIds<T>
): ObjectsListProps<T> {
    const tableProps = useObjectsTable(config, getRows, getAllIds);
    const [selection, setSelection] = useState<TableSelection[]>([]);

    const onChange = useCallback(
        (newState: TableState<T>) => {
            setSelection(newState.selection ?? []);
            tableProps.onChange(newState);
        },
        [tableProps]
    );

    const tableNotifications = useMemo<TableNotification[]>(() => {
        if (selection.length === 0) return [];

        const rows = tableProps.rows;
        const total = tableProps.pagination?.total ?? rows.length;
        const ids = tableProps.ids ?? [];

        const selectionInOtherPages = _.differenceBy(selection, rows, "id");
        const allSelectedInPage = rows.length > 0 && _.differenceBy(rows, selection, "id").length === 0;
        const multiplePagesAvailable = total > rows.length;
        const selectAllImplemented = ids.length > 0;

        const isSelectionCountVisible =
            selection.length === total ||
            selectionInOtherPages.length > 0 ||
            (allSelectedInPage && multiplePagesAvailable && selectAllImplemented);
        if (isSelectionCountVisible) return [];

        return [
            {
                message: i18n.t("There are {{count}} items selected on this page.", {
                    count: selection.length,
                }),
                link: i18n.t("Clear selection"),
                newSelection: [],
            },
        ];
    }, [selection, tableProps.rows, tableProps.pagination, tableProps.ids]);

    return { ...tableProps, onChange, tableNotifications };
}
