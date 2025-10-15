import { Id } from "./Ref";

export interface UserIdentifierProps {
    id: Id;
    username: string;
}

export class UserIdentifier {
    public readonly id: Id;
    public readonly username: string;

    constructor(props: UserIdentifierProps) {
        this.id = props.id;
        this.username = props.username;
    }
}
