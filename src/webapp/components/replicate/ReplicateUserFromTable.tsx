import React from "react";
import i18n from "../../../locales";
import { Id } from "../../../domain/entities/Ref";
import { ImportTable, Columns } from "../import-export/ImportTable";
import { useReplicateUserFromTable } from "../../hooks/useReplicateUserFromTable";

interface ReplicateUserFromTableProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
    onlyUsersOrgUnits: boolean;
}

const columns: Columns[] = [
    "username",
    "password",
    "firstName",
    "surname",
    "email",
    "userRoles",
    "userGroups",
    "dataViewOrganisationUnits",
    "organisationUnits",
];

export const ReplicateUserFromTable: React.FC<ReplicateUserFromTableProps> = props => {
    const { userToReplicateId, onRequestClose, onlyUsersOrgUnits } = props;
    const { replicateTitle, replicateUsers, userToReplicate, isMounted } = useReplicateUserFromTable(
        userToReplicateId,
        onRequestClose
    );

    if (!isMounted) {
        return null;
    }

    return (
        <ImportTable
            title={replicateTitle}
            actionText={i18n.t("Replicate")}
            usersFromFile={[]}
            columns={columns}
            onSubmit={replicateUsers}
            onRequestClose={props.onRequestClose}
            templateUser={userToReplicate}
            warnings={[]}
            onlyUsersOrgUnits={onlyUsersOrgUnits}
        />
    );
};

export default ReplicateUserFromTable;
