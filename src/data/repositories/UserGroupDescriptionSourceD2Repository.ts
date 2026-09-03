import _ from "lodash";
import { FutureData } from "../../domain/entities/Future";
import { NamedRef } from "../../domain/entities/Ref";
import { UserGroupDescriptionSourceRepository } from "../../domain/repositories/UserGroupDescriptionSourceRepository";
import { D2Api } from "../../types/d2-api";
import { apiToFuture } from "../../utils/futures";

/* In DHIS2 the description of a user group is stored in a metadata attribute,
 * so the opaque handle exposed to the domain is the attribute id. */
export class UserGroupDescriptionSourceD2Repository implements UserGroupDescriptionSourceRepository {
    constructor(private api: D2Api) {}

    get(): FutureData<NamedRef[]> {
        return apiToFuture(
            this.api.models.attributes.get({
                fields: { id: true, displayName: true },
                filter: { userGroupAttribute: { eq: "true" } },
                paging: false,
            })
        ).map(response =>
            _(response.objects)
                .map(d2Attribute => ({ id: d2Attribute.id, name: d2Attribute.displayName }))
                .sortBy(attribute => attribute.name)
                .value()
        );
    }
}
