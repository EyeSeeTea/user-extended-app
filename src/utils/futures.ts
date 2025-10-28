import { Codec, string } from "purify-ts";
import { CancelableResponse } from "@eyeseetea/d2-api/repositories/CancelableResponse";
import { Future, FutureData } from "../domain/entities/Future";

export function apiToFuture<Data>(res: CancelableResponse<Data>): FutureData<Data> {
    return Future.fromComputation((resolve, reject) => {
        res.getData()
            .then(resolve)
            .catch(err => {
                if (err instanceof Error && err) {
                    return reject(extractErrorMessageFromResponse(err));
                } else {
                    return reject(unknownErrorMessage);
                }
            });
        return res.cancel;
    });
}

function extractErrorMessageFromResponse(err: Error): string {
    const result = ErrorResponseCodec.decode(err);
    if (result.isRight()) {
        return result.extract().response.data.message;
    }
    return unknownErrorMessage;
}

const ErrorResponseCodec = Codec.interface({
    response: Codec.interface({ data: Codec.interface({ message: string }) }),
});

const unknownErrorMessage = "Unknown error";
