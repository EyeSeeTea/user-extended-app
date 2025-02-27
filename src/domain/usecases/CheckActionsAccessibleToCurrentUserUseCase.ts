import _ from "lodash";
import { ActionsPermissions } from "../entities/AppSettings";
import { isSuperAdmin, User } from "../entities/User";
import { getId } from "../entities/Ref";
import { UserAction } from "../entities/UserAction";

// Note for Reviewer: I made it sync to make it reactive, so I have the doubt if it shouldn't be a use case and just on the useHook
// but as there is a CheckCurrentUserCanAccessSettingsUseCase it makes sense to have  this also as a usecase
export class CheckActionsAccessibleToCurrentUserUseCase {
    execute(currentUser: User, actionsAccess: ActionsPermissions): Record<UserAction, boolean> {
        return this.checkActionsAccessible(currentUser, actionsAccess);
    }

    private checkActionsAccessible(user: User, actionsAccess: ActionsPermissions): Record<UserAction, boolean> {
        const userGroupIds = user.userGroups.map(getId);

        return _.mapValues(
            actionsAccess,
            permission =>
                isSuperAdmin(user) ||
                permission.isAccessible({
                    userId: user.id,
                    userGroupIds: userGroupIds,
                })
        );
    }
}
