import { FutureData } from "../entities/Future";
import { NamedRef } from "../entities/Ref";

/* Sources available to feed the description of a user group. The id is an opaque
 * handle: only the implementation knows what it points to. */
export interface UserGroupDescriptionSourceRepository {
    get(): FutureData<NamedRef[]>;
}
