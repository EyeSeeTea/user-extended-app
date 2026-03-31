export interface PaginatedResponse<T> {
    objects: T[];
    pager: Pager;
}

export interface Pager {
    page: number;
    pageCount: number;
    total: number;
    pageSize: number;
}

export type CommonFilterParams = {
    page: number;
    pageSize: number;
    search: string;
    sorting: { field: string; order: "asc" | "desc" };
};
