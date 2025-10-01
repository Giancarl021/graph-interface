/**
 * Extracts the item type from an array type.
 * If T is not an array, it resolves to never.
 * @typeParam T The type to extract the item type from.
 */
type ItemType<T> = T extends Array<infer U> ? U : never;

/**
 * The type of an instance returned by the `AsyncStream` function.
 * @typeParam T The type of items in the async generator.
 */
interface AsyncStreamInstance<T = unknown> extends AsyncIterableIterator<T> {
    /**
     * Groups items from the async generator into arrays of a specified size.
     * For example:
     * - Input: [1, 2, 3, 4, 5], packageSize: 2
     * - Output: [[1, 2], [3, 4], [5]]
     * @param packageSize The size of each package.
     * @returns An AsyncStream of arrays, each containing up to packageSize items.
     */
    pack: (packageSize: number) => AsyncStreamInstance<T[]>;
    /**
     * Repackages items from an async generator of arrays into new arrays of a specified size.
     * For example:
     * - Input: [[1, 2], [3, 4], [5]], packageSize: 3
     * - Output: [[1, 2, 3], [4, 5]]
     * @remarks Only available if T is an array type.
     * @param packageSize The size of each new package.
     * @returns An AsyncStream of arrays, each containing up to packageSize items.
     */
    repack: T extends Array<unknown>
        ? (packageSize: number) => AsyncStreamInstance<ItemType<T>[]>
        : never;
    /**
     * Flattens an async generator of arrays into a single async generator of items.
     * @remarks Only available if T is an array type.
     * @returns An AsyncStream of individual items.
     */
    unpack: T extends Array<unknown>
        ? () => AsyncStreamInstance<ItemType<T>>
        : never;
    /*
     * Collects all items from the async generator into a single array.
     * @returns A promise that resolves to a single array containing all items.
     */
    collect: () => Promise<T[]>;
    /**
     * Consumes the async generator without retaining any of its items.
     * @param maxIterations Optional maximum number of iterations to perform.
     * @returns A promise that resolves when the iterable has been fully consumed or the maximum iterations have been reached.
     */
    drain: (maxIterations?: number) => Promise<void>;
    /**
     * Transforms each item from the async generator using a provided predicate function.
     * @param predicate A function that takes an item and returns a transformed item or a promise of a transformed item.
     * @typeParam U The type of the transformed items.
     * @returns An AsyncStream of transformed items.
     */
    map: <U>(predicate: (item: T) => U | Promise<U>) => AsyncStreamInstance<U>;
    /**
     * Filters items from the async generator based on a provided predicate function.
     * @param predicate A function that takes an item and returns a boolean or a promise of a boolean indicating whether the item should be included.
     * @returns A promise that resolves to an array of items that satisfy the predicate.
     */
    filter: (
        predicate: (item: T) => boolean | Promise<boolean>
    ) => AsyncStreamInstance<T>;
    /**
     * Reduces the async generator to a single value using a provided reducer function and an initial value.
     * @param reducer A function that takes an accumulator and an item, and returns a new accumulator or a promise of a new accumulator.
     * @param initialValue The initial value for the accumulator.
     * @typeParam U The type of the accumulated value.
     * @returns A promise that resolves to the final accumulated value.
     */
    reduce: <U>(
        reducer: (accumulator: U, item: T) => U | Promise<U>,
        initialValue: U
    ) => Promise<U>;
    /**
     * Retrieves the first item from the async generator, or undefined if the iterable is empty.
     * @returns A promise that resolves to the first item or undefined.
     */
    first: () => Promise<T | undefined>;
    /**
     * Retrieves the last item from the async generator, or undefined if the iterable is empty.
     *
     * **Important:** This function will consume the entire iterable.
     * @returns A promise that resolves to the last item or undefined.
     */
    last: () => Promise<T | undefined>;
    /**
     * Retrieves up to the first N items from the async generator.
     * @param n The maximum number of items to retrieve.
     * @returns A promise that resolves to an array of the first N items.
     */
    firstN: (n: number) => Promise<T[]>;
    /**
     * Retrieves up to the last N items from the async generator.
     *
     * **Important:** This function will consume the entire iterable and store up to N items in memory.
     * @param n The maximum number of items to retrieve.
     * @returns A promise that resolves to an array of the last N items.
     */
    lastN: (n: number) => Promise<T[]>;
    /**
     * Counts the number of items in the async generator.
     *
     * **Important:** This function will consume the entire iterable.
     * @returns A promise that resolves to the count of items.
     */
    count: () => Promise<number>;
}

/**
 * Creates an object with various utility methods for working with async generators, while
 * also allowing direct iteration over the original async generator.
 * @typeParam T The type of items in the async generator.
 * @param iter The async generator to be wrapped with utility methods.
 * @returns An object containing the original async generator and various utility methods.
 */
export default function AsyncStream<T = unknown>(
    iter: AsyncIterableIterator<T>
): AsyncStreamInstance<T> {
    /**
     * Wraps an async iterable iterator into an AsyncStreamInstance.
     * @param iter The async iterable iterator to wrap.
     * @returns An AsyncStreamInstance wrapping the provided iterator.
     */
    function _wrap<T>(iter: AsyncIterableIterator<T>): AsyncStreamInstance<T> {
        return AsyncStream(iter);
    }

    /**
     * Groups items from an async generator into arrays of a specified size.
     * For example:
     * - Input: [1, 2, 3, 4, 5], packageSize: 2
     * - Output: [[1, 2], [3, 4], [5]]
     * @param packageSize The size of each package.
     * @returns An async generator of arrays, each containing up to packageSize items.
     */
    async function* pack(packageSize: number): AsyncIterableIterator<T[]> {
        let buffer: T[] = [];

        for await (const item of iter) {
            buffer.push(item);

            if (buffer.length === packageSize) {
                yield buffer;
                buffer = [];
            }
        }

        if (buffer.length > 0) {
            yield buffer;
        }
    }

    /**
     * Repackages items from an async generator of arrays into new arrays of a specified size.
     * For example:
     * - Input: [[1, 2], [3, 4], [5]], packageSize: 3
     * - Output: [[1, 2, 3], [4, 5]]
     * @param packageSize The size of each new package.
     * @returns An async generator of arrays, each containing up to packageSize items.
     */
    async function* repack(
        packageSize: number
    ): AsyncIterableIterator<ItemType<T>[]> {
        let buffer: ItemType<T>[] = [];

        for await (const page of iter as AsyncIterableIterator<ItemType<T>[]>) {
            if (!Array.isArray(page)) {
                throw new TypeError(
                    'Input async generator must yield arrays for repack.'
                );
            }
            buffer.push(...page);

            while (buffer.length >= packageSize) {
                yield buffer.slice(0, packageSize);
                buffer = buffer.slice(packageSize);
            }
        }

        if (buffer.length > 0) {
            yield buffer;
        }
    }

    /**
     * Flattens an async generator of arrays into a single async generator of items.
     * @returns An async generator of individual items.
     */
    async function* unpack(): AsyncIterableIterator<ItemType<T>> {
        for await (const page of iter as AsyncIterableIterator<ItemType<T>[]>) {
            if (!Array.isArray(page)) {
                throw new TypeError(
                    'Input async generator must yield arrays for unpack.'
                );
            }

            for (const item of page) {
                yield item;
            }
        }
    }

    /**
     * Transforms each item from an async generator using a provided predicate function.
     * @param predicate A function that takes an item and returns a transformed item or a promise of a transformed item.
     * @typeParam U The type of the transformed items.
     * @returns An async generator of transformed items.
     */
    async function* map<U>(
        predicate: (item: T) => U | Promise<U>
    ): AsyncIterableIterator<U> {
        for await (const item of iter) {
            yield await predicate(item);
        }
    }

    /**
     * Filters items from an async generator based on a provided predicate function.
     * @param predicate A function that takes an item and returns a boolean or a promise of a boolean indicating whether the item should be included.
     * @returns An async generator of items that satisfy the predicate.
     */
    async function* filter(
        predicate: (item: T) => boolean | Promise<boolean>
    ): AsyncIterableIterator<T> {
        for await (const item of iter) {
            if (await predicate(item)) {
                yield item;
            }
        }
    }

    /**
     * Reduces an async generator to a single value using a provided reducer function and an initial value.
     * @param reducer A function that takes an accumulator and an item, and returns a new accumulator or a promise of a new accumulator.
     * @param initialValue The initial value for the accumulator.
     * @typeParam U The type of the accumulated value.
     * @returns A promise that resolves to the final accumulated value.
     */
    async function reduce<U>(
        reducer: (accumulator: U, item: T) => U | Promise<U>,
        initialValue: U
    ): Promise<U> {
        let accumulator = initialValue;

        for await (const item of iter) {
            accumulator = await reducer(accumulator, item);
        }

        return accumulator;
    }

    /**
     * Collects all items from an async generator into a single array.
     * @returns A promise that resolves to a single array containing all items.
     */
    async function collect(): Promise<T[]> {
        const results: T[] = [];

        for await (const item of iter) {
            results.push(item);
        }

        return results;
    }

    /**
     * Consumes an async generator without retaining any of its items.
     * @param maxIterations Optional maximum number of iterations to perform.
     * @returns A promise that resolves when the iterable has been fully consumed or the maximum iterations have been reached.
     */
    async function drain(maxIterations?: number): Promise<void> {
        let count = 0;

        if (maxIterations !== undefined && maxIterations <= 0) {
            return;
        }

        if (maxIterations !== undefined) {
            for await (const _ of iter) {
                count++;
                if (count >= maxIterations) {
                    break;
                }
            }
            return;
        }

        for await (const _ of iter);
    }

    /**
     * Retrieves the first item from an async generator, or undefined if the iterable is empty.
     * @returns A promise that resolves to the first item or undefined.
     */
    async function first(): Promise<T | undefined> {
        for await (const item of iter) {
            return item;
        }
        return undefined;
    }

    /**
     * Retrieves the last item from an async generator, or undefined if the iterable is empty.
     *
     * **Important:** This function will consume the entire iterable.
     * @returns A promise that resolves to the last item or undefined.
     */
    async function last(): Promise<T | undefined> {
        let lastItem: T | undefined = undefined;
        for await (const item of iter) {
            lastItem = item;
        }
        return lastItem;
    }

    /**
     * Retrieves up to the first N items from an async generator.
     * @param n The maximum number of items to retrieve.
     * @returns A promise that resolves to an array of the first N items.
     */
    async function firstN(n: number): Promise<T[]> {
        const results: T[] = [];
        let count = 0;

        if (n <= 0) {
            return results;
        }

        for await (const item of iter) {
            results.push(item);
            count++;
            if (count >= n) {
                break;
            }
        }

        return results;
    }

    /**
     * Retrieves up to the last N items from an async generator.
     *
     * **Important:** This function will consume the entire iterable and store up to N items in memory.
     * @param n The maximum number of items to retrieve.
     * @returns A promise that resolves to an array of the last N items.
     */
    async function lastN(n: number): Promise<T[]> {
        const results: T[] = [];

        if (n <= 0) {
            return results;
        }

        for await (const item of iter) {
            results.push(item);
            if (results.length > n) {
                results.shift();
            }
        }

        return results;
    }

    /**
     * Counts the number of items in an async generator.
     *
     * **Important:** This function will consume the entire iterable.
     * @returns A promise that resolves to the count of items.
     */
    async function count(): Promise<number> {
        let count = 0;
        for await (const _ of iter) {
            count++;
        }
        return count;
    }

    return {
        ...iter,
        pack: packageSize => _wrap(pack(packageSize)),
        repack: packageSize => _wrap(repack(packageSize)),
        unpack: () => _wrap(unpack()),
        map: predicate => _wrap(map(predicate)),
        filter: predicate => _wrap(filter(predicate)),
        collect,
        drain,
        first,
        last,
        firstN,
        lastN,
        reduce,
        count
    } as AsyncStreamInstance<T>;
}
