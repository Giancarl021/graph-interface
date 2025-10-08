/**
 * A type representing the tenant identifier for authentication requests.
 * This can be one of the predefined values or a custom tenant ID.
 * - `common`: Used for applications that sign in users with both personal and work/school accounts.
 * - `organizations`: Used for applications that sign in users with work/school accounts only.
 * - `consumers`: Used for applications that sign in users with personal Microsoft accounts only.
 * - Custom tenant IDs or domains can be provided as strings.
 */
type Tenant = 'common' | 'organizations' | 'consumers' | (string & {});

export default Tenant;
