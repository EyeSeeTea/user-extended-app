// Central place for data size limits used across the domain/data layers
// Includes chunk sizes (batching) and pagination sizes.

export const DEFAULT_CHUNK_SIZE = 100;

// Domain-specific chunk sizes
export const IMPORT_USERS_CHUNK_SIZE = DEFAULT_CHUNK_SIZE;
export const COPY_IN_USER_CHUNK_SIZE = 50;
export const GET_USERS_BY_IDS_CHUNK_SIZE = 50;

// Pagination sizes
export const LIST_ALL_USERS_PAGE_SIZE = 100;
