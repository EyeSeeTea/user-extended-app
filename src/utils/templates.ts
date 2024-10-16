export const getFromTemplate = (template: string, index: number) => {
    return template.replace("$index", (index + 1).toString());
};
