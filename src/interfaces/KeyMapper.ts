interface KeyMapperItem {
    name: string;
    value: KeyMapper;
}

interface KeyMapper {
    [originalName: string]: KeyMapperItem | string;
}

export default KeyMapper;
