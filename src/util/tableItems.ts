import type TableItems from '../interfaces/TableItems.js';

/**
 * Type guard to check if the provided data conforms to the TableItems interface.
 * @param data - The data to be checked.
 * @template TItem - The type of items contained in the table, defaults to unknown.
 * It is there only for casting purposes.
 * @returns True if the data is of type TableItems<TItem>, otherwise false.
 */
export function isTableItems<TItem = unknown>(
    data: unknown
): data is TableItems<TItem> {
    // - Data must be an object
    // - Data must not be null
    // - Data must have a 'columns' property
    // - 'columns' property must be an array
    // - Data must have a 'rows' property
    // - 'rows' property must be an array
    if (
        typeof data === 'object' &&
        data !== null &&
        'columns' in data &&
        Array.isArray((data as Record<string, unknown>).columns) &&
        'rows' in data &&
        Array.isArray((data as Record<string, unknown>).rows)
    ) {
        // Further validate the structure of columns and rows if there is
        // at least one row
        if ((data.rows as unknown[]).length) {
            // - Row must be truthy
            // - Row must be an array
            // - Row length must match columns length
            if (
                !(data.rows as unknown[])[0] ||
                !Array.isArray((data.rows as unknown[][])[0]) ||
                (data.rows as unknown[][])[0].length !==
                    (data.columns as unknown[]).length
            ) {
                return false;
            }
        }

        return true;
    }

    return false;
}

/**
 * Parses a TableItems object into an array of TItem objects.
 * @param table - The TableItems object to be parsed.
 * @template TItem - The type of items contained in the table.
 * @returns An array of TItem objects parsed from the table.
 */
export function parseTableItems<TItem>(table: TableItems<TItem>): TItem[] {
    return table.rows.map(row => {
        const item = {} as TItem;

        table.columns.forEach((column, index) => {
            item[column.name] = row[index] as TItem[keyof TItem];
        });

        return item;
    });
}
