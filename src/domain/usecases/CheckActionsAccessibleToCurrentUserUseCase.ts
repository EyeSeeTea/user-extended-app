import _ from "lodash";
import { ActionsPermissions } from "../entities/AppSettings";
import { User } from "../entities/User";
import { getId } from "../entities/Ref";
import { UserAction } from "../entities/UserAction";
import { isPermissionAccessible } from "../entities/Permission";

// Note for Reviewer: I made it sync to make it reactive, so I have the doubt if it shouldn't be a use case and just on the useHook
// but as there is a CheckCurrentUserCanAccessSettingsUseCase it makes sense to have  this also as a usecase
export class CheckActionsAccessibleToCurrentUserUseCase {
    execute(currentUser: User, actionsAccess: ActionsPermissions): Record<UserAction, boolean> {
        return this.checkActionsAccessible(currentUser, actionsAccess);
    }

    private checkActionsAccessible(user: User, actionsAccess: ActionsPermissions): Record<UserAction, boolean> {
        const userGroupIds = user.userGroups.map(getId);

        return _.mapValues(actionsAccess, permission =>
            isPermissionAccessible({
                userId: user.id,
                userGroupIds: userGroupIds,
                permission: permission,
            })
        );
    }
}
