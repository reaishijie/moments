import { Prisma } from "@prisma/client";

export const CONFIG_ACCESS_LEVELS = ['public', 'user', 'admin'] as const;
export type ConfigAccessLevel = typeof CONFIG_ACCESS_LEVELS[number];

export type ConfigRecord = {
    k: string;
    v: string;
    name: string;
    description: string;
    category: string;
    sort: number;
    access_level: string;
}

type ConfigQuery = {
    key?: unknown;
    keys?: unknown;
    category?: unknown;
    categories?: unknown;
    accessLevel?: unknown;
    detail?: unknown;
}

export function parseConfigQuery(query: ConfigQuery, allowedAccessLevels: ConfigAccessLevel[]) {
    const requestedAccessLevels = parseList(query.accessLevel)
        .filter((level): level is ConfigAccessLevel => CONFIG_ACCESS_LEVELS.includes(level as ConfigAccessLevel));
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

export function buildConfigWhere(parsed: ReturnType<typeof parseConfigQuery>): Prisma.configWhereInput {
    return {
        access_level: { in: parsed.accessLevels },
        ...(parsed.keys.length ? { k: { in: parsed.keys } } : {}),
        ...(parsed.categories.length ? { category: { in: parsed.categories } } : {}),
    };
}

export function formatConfigResponse(configs: ConfigRecord[], detail: boolean) {
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
    }, {} as Record<string, string>);
}

function parseList(value: unknown): string[] {
    const values = Array.isArray(value) ? value : [value];
    return values
        .flatMap(item => typeof item === 'string' ? item.split(',') : [])
        .map(item => item.trim())
        .filter(Boolean);
}

function isTruthy(value: unknown) {
    return value === true || value === '1' || value === 'true';
}
