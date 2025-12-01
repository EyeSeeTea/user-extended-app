import Store from "d2-ui/lib/store/Store";
import { Observable, Subject } from "rxjs/Rx";
import { getUserList } from "../models/userList";

export const columns = [
    { name: "username", sortable: false },
    { name: "firstName", sortable: true },
    { name: "surname", sortable: true },
    { name: "email", sortable: false },
    { name: "lastUpdated", sortable: true },
    { name: "created", sortable: true },
    { name: "userRoles", sortable: false },
    { name: "userGroups", sortable: false },
    { name: "organisationUnits", sortable: false },
    { name: "dataViewOrganisationUnits", sortable: false },
    { name: "searchOrganisationsUnits", sortable: false },
    { name: "lastLogin", sortable: false },
    { name: "disabled", sortable: false },
    { name: "phoneNumber", sortable: false },
];

let d2 = null;
let api = null;

export default Store.create({
    listSourceSubject: new Subject(),
    listRolesSubject: new Subject(),
    listGroupsSubject: new Subject(),
    listOrgUnitsSubject: new Subject(),

    initialise(deps) {
        d2 = deps.d2;
        api = deps.api;
        return this;
    },

    getRoles() {
        if (!api) return;

        const rolesPromise = api.get("/userRoles", { paging: false, fields: "id,displayName" }).getData();

        Observable.fromPromise(rolesPromise).subscribe(res => {
            this.listRolesSubject.next(res);
        });
    },

    getGroups() {
        if (!api) return;

        const groupsPromise = api.get("/userGroups", { paging: false, fields: "id,displayName" }).getData();

        Observable.fromPromise(groupsPromise).subscribe(res => {
            this.listGroupsSubject.next(res);
        });
    },

    getNextPage() {
        this.listSourceSubject.next(Observable.fromPromise(this.state.pager.getNextPage()));
    },

    getPreviousPage() {
        this.listSourceSubject.next(Observable.fromPromise(this.state.pager.getPreviousPage()));
    },

    filter(options, complete) {
        if (!d2) return;

        const { filters, ...listOptions } = options;
        const listSearchPromise = getUserList(d2, filters, listOptions);
        this.listSourceSubject.next(Observable.fromPromise(listSearchPromise));
        complete(`list with filters '${filters}' is loading`);
    },
});
