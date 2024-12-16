export const getFromTemplate = (template: string, index: number) => {
    return template.replace(/\$index/g, (index + 1).toString());
};
