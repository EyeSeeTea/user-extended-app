import { MetadataResponse } from "../types/d2-api";
import _ from "lodash";
import { Future, FutureData } from "../domain/entities/Future";
import { DEFAULT_CHUNK_SIZE } from "../domain/utils/limits";
import { Id } from "../domain/entities/Ref";
import { Maybe } from "../types/utils";
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

const maskedValue = "****";

/** Mask by name: the prefetch reads the $owner preset, so DHIS2 can return a secret this app
 * never declares. */
const secretPropPattern = /password|token|secret/i;
const nonSecretProps = ["passwordLastUpdated"];

function maskSecretProps<T extends object>(object: T): T {
    return _.mapValues(object as Record<string, unknown>, (value, key) =>
        value && secretPropPattern.test(key) && !nonSecretProps.includes(key) ? maskedValue : value
    ) as T;
}

/** Removes the secrets from the users before the logger writes them to the data store. */
export function buildUserWithoutPassword(users: ApiUser[]) {
    return users.map(user => ({
        ...maskSecretProps(user),
        userCredentials: { ...maskSecretProps(user.userCredentials), password: maskedValue },
        password: maskedValue,
    }));
}

/** The e-mail verification pair that DHIS2 owns but this app does not map to the domain. */
export type EmailVerificationProps = {
    verifiedEmail?: string;
    emailVerificationToken?: string;
};

export type ExistingApiUser = ApiUser & EmailVerificationProps;

/** Builds the /api/metadata payload for one user: the edited user merged over the prefetched
 * server copy, so REPLACE cannot erase the properties the app does not map. */
export function buildUserToSave(existingUser: Maybe<ExistingApiUser>, user: ApiUser) {
    // A changed e-mail makes the pair stale, so omit it: DHIS2 keeps verifiedEmail unique, and a
    // stale value stops a different user from verifying that address. E-mail 2FA is safe here,
    // because the server refuses to change the e-mail of such a user (error E3052).
    const keepsEmail = user.email === existingUser?.email;
    const existingUserProps: Partial<ExistingApiUser> = keepsEmail
        ? existingUser ?? {}
        : _.omit(existingUser, ["verifiedEmail", "emailVerificationToken"]);

    const shouldSendPassword = Boolean(user.userCredentials.password);
    const effectiveOpenId = user.openId ?? user.userCredentials.openId;
    const effectiveLdapId = user.ldapId ?? user.userCredentials.ldapId;

    const shouldSendOpenId = effectiveOpenId !== undefined && effectiveOpenId !== "";
    const shouldSendLdapId = effectiveLdapId !== undefined && effectiveLdapId !== "";
    const shouldSendAccountExpiry =
        user.userCredentials.accountExpiry !== undefined && user.userCredentials.accountExpiry !== "";
    const shouldSendTwoFA = user.userCredentials.twoFA === true;
    // Without this, the spread injects twoFA:false and disables 2FA on save.
    const userCredentialsWithoutTwoFA = _.omit(user.userCredentials, ["twoFA"]);

    return {
        ...existingUserProps,
        ...user,
        // Dual-write: DHIS2 2.42+ removed the userCredentials schema and needs these fields at
        // root level, while ≤2.41 needs them inside userCredentials (2.38 ignores root level).
        disabled: user.disabled ?? user.userCredentials.disabled,
        ...(shouldSendOpenId ? { openId: effectiveOpenId } : {}),
        ...(shouldSendLdapId ? { ldapId: effectiveLdapId } : {}),
        ...(shouldSendPassword ? { password: user.userCredentials.password } : {}),
        userCredentials: {
            ...existingUser?.userCredentials,
            ...userCredentialsWithoutTwoFA,
            id: user.id,
            ...(shouldSendOpenId ? { openId: effectiveOpenId } : {}),
            ...(shouldSendLdapId ? { ldapId: effectiveLdapId } : {}),
            ...(shouldSendPassword ? { password: user.userCredentials.password } : {}),
            ...(shouldSendAccountExpiry ? { accountExpiry: user.userCredentials.accountExpiry } : {}),
            ...(shouldSendTwoFA ? { twoFA: true } : {}),
        },
    };
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
