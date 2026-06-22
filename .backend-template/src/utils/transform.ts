export function toCamelCase(value: string): string {
    return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelizeRow<T extends Record<string, any>>(row: T): T {
    return Object.entries(row).reduce((result, [key, value]) => {
        const camelKey = toCamelCase(key);
        result[camelKey] = Array.isArray(value)
            ? value.map((item) => (typeof item === 'object' && item !== null ? camelizeRow(item) : item))
            : typeof value === 'object' && value !== null && !(value instanceof Date)
                ? camelizeRow(value)
                : value;
        return result;
    }, {} as Record<string, any>) as T;
}

export function camelizeRows<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.map((row) => camelizeRow(row));
}
