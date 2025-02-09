type UserSearchItem = {
    id: string;
    displayName: string;
};

export type UserSearch = {
    users: UserSearchItem[];
    userGroups: UserSearchItem[];
};
