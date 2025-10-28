import { Maybe } from "../../types/utils";

export function getLanguage(language: Maybe<string>): string {
    return language || "en";
}
