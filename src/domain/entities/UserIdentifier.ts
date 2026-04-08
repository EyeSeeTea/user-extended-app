import { Id } from "./Ref";

export interface UserIdentifierProps {
    id: Id;
    username: string;
    name: string;
}

export class UserIdentifier {
    public readonly id: Id;
    public readonly username: string;
    public readonly name: string;

    constructor(props: UserIdentifierProps) {
        this.id = props.id;
        this.username = props.username;
        this.name = props.name;
    }
}
