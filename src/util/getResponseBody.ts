/**
 * Retrieves and formats the body of a Response object.
 * @remarks This function is used to provide a readable representation of the response body,
 * especially useful for logging or error handling. It attempts to parse the body as JSON
 * for pretty-printing; if that fails, it returns the raw text. If the body cannot be read,
 * it returns a placeholder indicating binary content.
 * @param response - The Response object from which to extract the body.
 * @returns A promise that resolves to the formatted body as a string.
 */
export default async function getResponseBody(
    response: Response
): Promise<string> {
    try {
        // Clone the response to avoid consuming the original stream
        // and tries to parse it as text
        const text = await response.clone().text();

        try {
            // Attempt to parse the text as JSON for pretty-printing
            const json = JSON.parse(text);
            return JSON.stringify(json, null, 2);
        } catch {
            // If parsing fails, return the raw text
            return text;
        }
    } catch {
        // If the body cannot be read (e.g., binary data), return a placeholder
        return '<binary>';
    }
}
