// Pagination middleware for consistent cursor-based pagination
export const paginationMiddleware = (defaultLimit = 20, maxLimit = 100) => {
  return (req, res, next) => {
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit || defaultLimit, 10)));
    const cursor = req.query.cursor;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    
    req.pagination = {
      limit,
      cursor,
      page,
      skip: cursor ? 0 : (page - 1) * limit
    };
    
    next();
  };
};

// Helper to build cursor query
export const buildCursorQuery = (baseQuery = {}, cursor, cursorField = 'createdAt') => {
  if (!cursor) return baseQuery;
  
  return {
    ...baseQuery,
    [cursorField]: { $lt: new Date(cursor) }
  };
};

// Helper to build pagination response
export const buildPaginationResponse = (items, req, cursorField = 'createdAt') => {
  const { limit, page } = req.pagination;
  const hasMore = items.length === limit;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1][cursorField] : null;
  
  return {
    items,
    pagination: {
      hasMore,
      nextCursor,
      page,
      limit,
      count: items.length
    }
  };
};