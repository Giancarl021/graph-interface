interface KeyMapperItem {
    name: string;
    value: KeyMapper;
}

/**
 * Interface for the key mapper object, that
 * maps the keys of an object to a new key
 */
type KeyMapper = Record<string, KeyMapperItem | string>;

export default KeyMapper;
