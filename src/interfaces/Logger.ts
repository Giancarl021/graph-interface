/**
 * Logger interface, used to log messages
 */
type Logger = (message: string) => void | Promise<void>;

export default Logger;
