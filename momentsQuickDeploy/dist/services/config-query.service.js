export const CONFIG_ACCESS_LEVELS = ['public', 'user', 'admin'];
export function parseConfigQuery(query, allowedAccessLevels) {
    const requestedAccessLevels = parseList(query.accessLevel)
        .filter((level) => CONFIG_ACCESS_LEVELS.includes(level));
    const accessLevels = requestedAccessLevels.length
        ? requestedAccessLevels.filter(level => allowedAccessLevels.includes(level))
        : allowedAccessLevels;
    return {
        keys: [...new Set([...parseList(query.key), ...parseList(query.keys)])],
        categories: [...new Set([...parseList(query.category), ...parseList(query.categories)])],
        accessLevels,
        detail: isTruthy(query.detail),
    };
}
export function buildConfigWhere(parsed) {
    return {
        access_level: { in: parsed.accessLevels },
        ...(parsed.keys.length ? { k: { in: parsed.keys } } : {}),
        ...(parsed.categories.length ? { category: { in: parsed.categories } } : {}),
    };
}
export function formatConfigResponse(configs, detail) {
    if (detail) {
        return configs.map(config => ({
            key: config.k,
            value: config.v,
            name: config.name,
            description: config.description,
            category: config.category,
            sort: config.sort,
            accessLevel: config.access_level,
        }));
    }
    return configs.reduce((acc, currentItem) => {
        acc[currentItem.k] = currentItem.v;
        return acc;
    }, {});
}
function parseList(value) {
    const values = Array.isArray(value) ? value : [value];
    return values
        .flatMap(item => typeof item === 'string' ? item.split(',') : [])
        .map(item => item.trim())
        .filter(Boolean);
}
function isTruthy(value) {
    return value === true || value === '1' || value === 'true';
}
