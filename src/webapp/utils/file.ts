import moment from "moment";

export function getFilename({ name, format }: { name: string; format: string }): string {
    const datetime = moment().format("YYYY-MM-DD_HH-mm-ss");
    return `${name}-${datetime}.${format}`;
}
