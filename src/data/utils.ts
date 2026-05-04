import { MetadataResponse } from "../types/d2-api";
import _ from "lodash";
import { Future, FutureData } from "../domain/entities/Future";
import { DEFAULT_CHUNK_SIZE } from "../domain/utils/limits";
import { Id } from "../domain/entities/Ref";
import { ApiUser, D2UserGroupByKey } from "./repositories/UserD2ApiRepository";

export function chunkRequest<Res>(
    ids: Id[],
    mapper: (idsGroup: Id[]) => FutureData<Res[]>,
    chunkSize = DEFAULT_CHUNK_SIZE,
    options: { maxConcurrency?: number } = {}
): FutureData<Res[]> {
    const futures = _.chunk(ids, chunkSize).map(idsC => {
        return mapper(idsC);
    });

    if (options.maxConcurrency && options.maxConcurrency > 1) {
        return Future.parallel(futures, { maxConcurrency: options.maxConcurrency }).map(listOfValues =>
            _.flatten(listOfValues)
        );
    }

    return Future.flatten(futures);
}

export function getErrorFromResponse(typeReports: MetadataResponse["typeReports"]): string {
    return _(typeReports)
        .flatMap(typeReport => typeReport.objectReports || [])
        .flatMap(objectReport => objectReport.errorReports || [])
        .flatMap(errorReport => errorReport.message)
        .compact()
        .uniq()
        .join("\n");
}

export function buildUserWithoutPassword(users: ApiUser[]) {
    return _(users)
        .map(user => {
            return { ...user, userCredentials: { ...user.userCredentials, password: "****" }, password: "****" };
        })
        .value();
}

export function getDiffUserIdsByGroup(
    sourceGroups: D2UserGroupByKey,
    referenceGroups: D2UserGroupByKey
): Array<{ id: Id; usersIds: Id[] }> {
    return Object.keys(sourceGroups).map(groupId => {
        const sourceUserGroup = sourceGroups[groupId] || [];
        const userIdsInRefGroup = referenceGroups[groupId]?.map(({ id }) => id) || [];

        const diffUserIds = sourceUserGroup.filter(user => !userIdsInRefGroup.includes(user.id)).map(({ id }) => id);

        return { id: groupId, usersIds: _.uniq(diffUserIds) };
    });
}
