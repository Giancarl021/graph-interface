export default function (pattern: string, values: string[][]): string[] {
    const resources: string[] = [];
    const formatParams: string[][] = [];

    const l = values.length;

    for (let i = 0; i < l; i++) {
        const items = values[i];
        const s = items.length;

        for (let j = 0; j < s; j++) {
            if (formatParams[j] === undefined) formatParams.push([ items[j] ]);
            else formatParams[j].push(items[j]);
        }
    }

    for (const param of formatParams) {
        resources.push(format(pattern, ...param));
    }

    return resources;
}

function format(str: string, ...values: string[]) {
    return str.replace(/{(\d+)}/g, (match: string, n: string) => {
        const value = values[Number(n)];
        if (!value) throw new Error('Missing value for ' + match);
        return value;
    });
}