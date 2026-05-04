-   Set Column settings for all users (toggle)
    -> If true -> (1) Show list of column labels with three options: disable, visible, optional (2) Column settings should display only settings selected by the admin

    -   Get settings from datastore 1h
    -   Save settings to datastore 1h
    -   UI for settings 3h
        ![image](https://github.com/user-attachments/assets/3e074590-6900-4a51-8264-e5ef78cadb6e)
    -   Apply current settings in **UserListTable** component 2h

-   Setting section available for all users (toggle)

    -   UI settings 1.5h
    -   Apply current settings in **SettingsDialogModal** component 2h

-   Show only users assigned to my org unit (toggle) !!What OU? Capture, View and Searchable? -> If true -> Restrict vision depending on user OU and children -> If false -> Current behaviour (Assuming OU capture for the estimation)

http://localhost:8080/api/users.json?fields=id,username,organisationUnits[id,level,name]&userOrgUnits=true&includeChildren=true

    -   UI settings (a checkbox to enable/disable functionality) 0.5h
    -   Get org. units capture from current user 0.5h
    -   Apply filter in usecase **ListUsersUseCase** 1h
    -   Hide org. unit from filters component so user cannot override the behavior 2h

-   Actions available for all users (toggle) -> If true -> Current behaviour -> If false -> Show list of actions with at the side with multiselectable dropdown with list of user groups

    -   UI Settings 3h ![image](https://github.com/user-attachments/assets/3c0b57c4-03dc-4eea-b8ea-51be6592fee2)
    -   Apply settings in **UserListTable** component 1h

-   Show only active account (toggle) -> If true -> Show only active accounts -> If false -> Current behaviour

    -   UI settings 0.5h
    -   Apply filter in usecase **ListUsersUseCase** 1h
    -   Hide "Filter by active/inactive users" from **Filters.component.js** component so user cannot override the behavior 0.5h (asumming we already did part of the task in number 3)

-   Hide user roles, groups and users

    -   UI settings 3h (roles and groups)
    -   UI settings for users 8h (For performance reasons we cannot just list all users into a dropdown. We can have a searchbox and the user selects the ones to exclude)
        ![image](https://github.com/user-attachments/assets/8f555f1f-2149-44a5-a8e1-8d2ff5effe43)
    -   Add logic to **ListUsersUseCase** (it could be impact other usecases) to exclude roles, groups and users 4h

-   Change to 4 tabs mode: users, user groups, user roles and dashboards

    -   Add tabs 2h
    -   Add table for user groups (custom details component for showing users in groups) 3h
    -   Filters for user groups 4h
    -   Add table for user roles (custom details component for showing users in roles) 2h
    -   Add table for visualizations 3h (6h if we need to include a column for visualizations since visualizations schema vary by its type: CHART, TEXT, BAR, ETC)
    -   Filters for dashboards 4h

-   Migrate **List.component.js** from javascript to typescript + clean arch. 8h (this task is not really necessary but since we already need to modify it for some tasks could be a good opportunity)

-   Possible meetings, testing and PR Review 6h

Total Hours: 67.5h (70.5h in case we need a visualizations column for dashboards)

Datastore settings example

```json
{
    "columns": [
        {
            "username": "visible"
        },
        {
            "roles": "visible"
        },
        {
            "id": "optional"
        },
        {
            "email": "disable"
        }
    ],
    "settingsAccess": ["user_group_1", "user_group_2"],
    "filterByUserOrgUnit": true,
    "actionsAccess": [
        {
            "action": "edit",
            "usersGroups": ["user_group_3", "user_group_4"]
        }
    ],
    "showOnlyEnabled": true,
    "excludeList": [
        {
            "type": "users",
            "ids": ["user_id_1", "user_id_2"]
        },
        {
            "type": "groups",
            "ids": []
        },
        {
            "type": "roles",
            "ids": []
        }
    ]
}
```
