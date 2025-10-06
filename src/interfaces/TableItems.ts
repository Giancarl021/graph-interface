/**
 * Interface representing a column in a table.
 * @template TItem - The type of items contained in the table.
 */
interface TableItemColumn<TItem> {
    /**
     * The name of the column, which corresponds to a key in TItem.
     */
    name: keyof TItem;
    /**
     * The data type of the column (e.g., 'string', 'number', etc.).
     */
    type: string;
}

/**
 * Interface representing a table structure with columns and rows.
 * @template TItem - The type of items contained in the table.
 */
export default interface TableItems<TItem> {
    /**
     * An array of columns defining the structure of the table.
     */
    columns: TableItemColumn<TItem>[];
    /**
     * A two-dimensional array representing the rows of the table.
     * Each inner array corresponds to a row, with values matching the column definitions in respective order.
     */
    rows: TItem[keyof TItem][][];
}
