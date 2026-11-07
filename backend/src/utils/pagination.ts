export const DEFAULT_PAGE_SIZE = 5
export const MAX_PAGE_SIZE = 50

export interface Pagination {
  page: number
  pageSize: number
  skip: number
  take: number
}

function parsePositiveInt(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' && typeof raw !== 'number') return fallback

  const parsed = Number.parseInt(String(raw), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * 统一解析分页参数并做上下限收敛，避免客户端传入超大 pageSize
 * 导致全表扫描，或传入负数 page 让 Prisma 抛错返回 500。
 */
export function parsePagination(
  query: { page?: unknown; pageSize?: unknown },
  options: { defaultPageSize?: number; maxPageSize?: number } = {},
): Pagination {
  const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE
  const maxPageSize = options.maxPageSize ?? MAX_PAGE_SIZE

  const page = Math.max(1, parsePositiveInt(query.page, 1))

  const requestedPageSize = parsePositiveInt(query.pageSize, defaultPageSize)
  const pageSize = Math.min(Math.max(1, requestedPageSize), maxPageSize)

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}
