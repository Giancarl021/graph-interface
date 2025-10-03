export default async function getResponseBody(
    response: Response
): Promise<string> {
    try {
        const text = await response.clone().text();

        try {
            const json = JSON.parse(text);
            return JSON.stringify(json, null, 2);
        } catch {
            return text;
        }
    } catch {
        return '<binary>';
    }
}
