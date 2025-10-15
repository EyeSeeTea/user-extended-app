import { Struct } from "./generic/Struct";
import { NamedRef } from "./Ref";

export type UserSimpleAttrs = NamedRef & { email: string; lastName: string };
export class UserSimple extends Struct<UserSimpleAttrs>() {
    get fullDescription(): string {
        const emailLabel = this.email ? `(${this.email})` : "";
        return `${this.name} ${this.lastName} ${emailLabel}`;
    }
}
