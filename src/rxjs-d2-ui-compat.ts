import { Observable, from } from "rxjs";

/**
 * RxJS compatibility for DHIS2 legacy UI (d2-ui).
 *
 * The legacy DHIS2 UI layer we still consume via `d2-ui` is compiled
 * against RxJS 5 APIs and calls `Observable.fromPromise(...)`.
 * Our app runs on RxJS 6+ where `Observable.fromPromise` no longer exists.
 *
 * This shim must be executed before any `d2-ui` modules are imported,
 * otherwise the app will crash at runtime when legacy actions are fired
 * (e.g. during unmount lifecycle paths).
 *
 * Once the legacy codepaths are removed and we no longer depend on `d2-ui`,
 * this file (and its import in `src/index.tsx`) can be deleted.
 */
const O = Observable as typeof Observable & { fromPromise?: typeof from };

if (typeof O.fromPromise !== "function") {
    O.fromPromise = from;
}
