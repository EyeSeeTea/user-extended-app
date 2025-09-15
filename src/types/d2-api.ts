import { D2Api } from "@eyeseetea/d2-api/2.41";
import { getMockApiFromClass } from "@eyeseetea/d2-api";
export type { TeiGetRequest } from "@eyeseetea/d2-api/api/trackedEntityInstances";
export type { PatchOperation } from "@eyeseetea/d2-api/api/patch";
export type { ErrorReport } from "@eyeseetea/d2-api/api/common";
export type { CancelableResponse } from "@eyeseetea/d2-api/repositories/CancelableResponse";

export * from "@eyeseetea/d2-api/2.41";
export const getMockApi = getMockApiFromClass(D2Api);
