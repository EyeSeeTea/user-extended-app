import { Struct } from "./generic/Struct";
import { NamedRef } from "./Ref";

export type UserSimpleAttrs = NamedRef & { firstName: string; email: string; lastName: string; username: string };
export class UserSimple extends Struct<UserSimpleAttrs>() {
    get fullDescription(): string {
        const emailLabel = this.email ? `(${this.email})` : "";
        return `${this.name} ${this.lastName} ${emailLabel}`;
    }

    get fullUserName(): string {
        return `${this.firstName} ${this.lastName} (${this.username})`;
    }
}
