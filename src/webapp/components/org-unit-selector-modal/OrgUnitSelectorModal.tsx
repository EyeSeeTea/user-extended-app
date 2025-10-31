import React from "react";
import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";
import { Id } from "../../../domain/entities/Ref";
import { extractIdsFromPaths, joinPaths } from "../../../utils/d2-api";

const controls = {
    filterByLevel: false,
    filterByGroup: false,
    filterByProgram: false,
    selectAll: false,
};

export const OrgUnitSelectorModal: React.FC<OrgUnitSelectorModalProps> = props => {
    const { api, compositionRoot } = useAppContext();
    const { onSave, orgUnitIds } = props;
    const [initialOrgUnitIds] = React.useState<Id[]>(orgUnitIds);
    const [selectedPaths, setPaths] = React.useState<string[]>();

    React.useEffect(() => {
        return compositionRoot.metadata.getOrgUnitPaths(initialOrgUnitIds).run(orgUnits => {
            setPaths(orgUnits.map(ou => joinPaths(ou)).flat());
        }, console.error);
    }, [compositionRoot.metadata, initialOrgUnitIds]);

    const onChangeOrgUnit = React.useCallback(
        (paths: string[]) => {
            setPaths(paths);
            onSave(extractIdsFromPaths(paths));
        },
        [onSave]
    );

    return (
        <div className="org-unit-dialog-selector">
            <OrgUnitsSelector
                api={api}
                selected={selectedPaths}
                onChange={onChangeOrgUnit}
                controls={controls}
                showNameSetting={true}
            />
        </div>
    );
};

export type OrgUnitSelectorModalProps = {
    orgUnitIds: Id[];
    onSave: (orgUnitIds: Id[]) => void;
};
