import _ from "lodash";

export const getFromTemplate = (template: string, count: number) => {
    if (count && count > 0) {
        return _(count).times(index => template.replace("$index", (index + 1).toString()));
    } else {
        return [];
    }
};
