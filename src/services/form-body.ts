/**
 *
 */
export default function formBody(data: Record<string, string>): string {
    const body: string[] = [];
    for (const key in data) {
        body.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
        );
    }

    return body.join('&');
}
