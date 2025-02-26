type UserSearchItem = {
    id: string;
    name: string;
};

export type UserSearch = {
    users: UserSearchItem[];
    userGroups: UserSearchItem[];
};
