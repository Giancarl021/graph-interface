# keyMapper

This interface is used to rename properties on the body of a Graph API response. This interface is available in the [unit](unit.md), [list](list.md) and [massive](massive.md) methods, as it is part of the [requestOptions](requestOptions.md) base interface.

## Properties

This interface is defined as the following:

```typescript
interface KeyMapper {
    [originalName: string]: KeyMapperItem | string;
}

interface KeyMapperItem {
    name: string;
    value: KeyMapper;
}
```

-   **originalName** - The name of the property on the response body that should be renamed.

-   **`originalName` value** - A string with a new name for the property, or, for nested properties, an object with the new name of the property and another `KeyMapper` as a value.
