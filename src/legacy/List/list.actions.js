import Action from "d2-ui/lib/action/Action";
import listStore from "./list.store";
import detailsStore from "./details.store";
import { Observable } from "rx";

const listActions = Action.createActionsFromNames([
    "loadList",
    "setListSource",
    "filter",
    "loadUserRoles",
    "loadUserGroups",
    "getNextPage",
    "getPreviousPage",
    "hideDetailsBox",
]);

listActions.setListSource.subscribe(action => {
    listStore.listSourceSubject.onNext(Observable.just(action.data));
});

listActions.filter.subscribe(action => {
    listStore.filter(action.data, action.complete, action.error);
});

// TODO: For simple action mapping like this we should be able to do something less boiler plate like
listActions.getNextPage.subscribe(() => {
    listStore.getNextPage();
});

listActions.getPreviousPage.subscribe(() => {
    listStore.getPreviousPage();
});

listActions.hideDetailsBox.subscribe(() => {
    detailsStore.setState(null);
});

listActions.loadUserRoles.subscribe(() => {
    listStore.getRoles();
});

listActions.loadUserGroups.subscribe(() => {
    listStore.getGroups();
});

export default listActions;
