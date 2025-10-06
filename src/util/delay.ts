/**
 * Delays execution for a given number of milliseconds.
 * @param ms - The number of milliseconds to delay.
 * @returns A promise that resolves after the specified delay.
 */
export default function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
