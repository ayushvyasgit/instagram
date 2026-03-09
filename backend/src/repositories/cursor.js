/**
 * cursor.js — Bidirectional cursor encoding/decoding utilities
 *
 * A cursor encodes the position of the LAST item seen on the current page.
 * For bidirectional use:
 *   - nextCursor = encoded last item  → use with direction=next
 *   - prevCursor = encoded first item → use with direction=prev
 */

/**
 * Encode a cursor payload to a base64 opaque string.
 * @param {Object} data - { id, created_at }
 * @returns {string} base64 encoded cursor
 */
export function encodeCursor(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode a base64 cursor string back to its payload.
 * @param {string} cursor - base64 string from client
 * @returns {{ id: string, created_at: string }}
 * @throws {Error} if cursor is malformed
 */
export function decodeCursor(cursor) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    if (!decoded.id || !decoded.created_at) {
      throw new Error('Invalid cursor structure');
    }
    return decoded;
  } catch {
    throw new Error('Invalid or malformed cursor');
  }
}

/**
 * Build the SQL WHERE fragment + parameter array for cursor-based filtering.
 *
 * Strategy:
 *   direction=next → fetch rows OLDER than the cursor (created_at DESC)
 *   direction=prev → fetch rows NEWER than the cursor (created_at ASC, reversed after)
 *
 * Uses composite condition (created_at, id) to handle timestamp ties.
 *
 * @param {string|null} cursor         - raw base64 cursor (null = first page)
 * @param {'next'|'prev'} direction    - scroll direction
 * @param {Array} existingParams       - existing query params array (mutated & returned)
 * @returns {{ clause: string, params: Array, decoded: Object|null }}
 */
export function buildCursorCondition(cursor, direction = 'next', existingParams = []) {
  if (!cursor) {
    return { clause: '', params: existingParams, decoded: null };
  }

  const decoded = decodeCursor(cursor);
  const base = existingParams.length; // offset for $N numbering

  // params: [...existing, cursor_time, cursor_id]
  existingParams.push(decoded.created_at); // $base+1
  existingParams.push(decoded.id);         // $base+2

  const timeParam = `$${base + 1}`;
  const idParam   = `$${base + 2}`;

  let clause;

  if (direction === 'next') {
    // Older posts: created_at before cursor OR same time with smaller id
    clause = `
      AND (
        p.created_at < ${timeParam}
        OR (p.created_at = ${timeParam} AND p.id < ${idParam})
      )`;
  } else {
    // direction === 'prev': newer posts
    clause = `
      AND (
        p.created_at > ${timeParam}
        OR (p.created_at = ${timeParam} AND p.id > ${idParam})
      )`;
  }

  return { clause, params: existingParams, decoded };
}

/**
 * Get the ORDER BY clause based on direction.
 *   next → DESC (newest first within the page)
 *   prev → ASC  (we flip the array after fetching)
 *
 * @param {'next'|'prev'} direction
 * @returns {string}
 */
export function buildOrderClause(direction = 'next') {
  return direction === 'next'
    ? 'ORDER BY p.created_at DESC, p.id DESC'
    : 'ORDER BY p.created_at ASC,  p.id ASC';
}

/**
 * Process raw DB rows for bidirectional cursor pagination.
 *
 * Steps:
 *  1. Detect hasMore by checking if we got limit+1 rows
 *  2. Slice to limit rows
 *  3. Reverse array if direction=prev (we fetched in ASC, want DESC)
 *  4. Build prevCursor (from first item) and nextCursor (from last item)
 *  5. Determine hasPreviousPage and hasNextPage
 *
 * @param {Array}  rows       - raw rows from DB (limit+1 fetched)
 * @param {number} limit      - requested page size
 * @param {'next'|'prev'} direction
 * @param {string|null} incomingCursor - the cursor passed by client (null = first page)
 * @returns {{ items: Array, pagination: Object }}
 */
export function processCursorPage(rows, limit, direction = 'next', incomingCursor = null) {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  // Reverse for prev direction (fetched ASC, display DESC)
  if (direction === 'prev') {
    pageRows.reverse();
  }

  const isEmpty = pageRows.length === 0;

  // Build cursors from first and last items on the page
  const firstItem = isEmpty ? null : pageRows[0];
  const lastItem  = isEmpty ? null : pageRows[pageRows.length - 1];

  const firstCursor = firstItem
    ? encodeCursor({ id: firstItem.id, created_at: firstItem.created_at })
    : null;
  const lastCursor = lastItem
    ? encodeCursor({ id: lastItem.id, created_at: lastItem.created_at })
    : null;

  /**
   * hasNextPage  = there are older posts AFTER the last item on this page
   * hasPreviousPage = there are newer posts BEFORE the first item on this page
   *
   * When direction=next:
   *   hasNextPage = hasMore (we fetched limit+1 and got it)
   *   hasPreviousPage = !!incomingCursor (we came from somewhere)
   *
   * When direction=prev:
   *   hasPreviousPage = hasMore
   *   hasNextPage = !!incomingCursor
   */
  const hasNextPage = direction === 'next'
    ? hasMore
    : !!incomingCursor;

  const hasPreviousPage = direction === 'prev'
    ? hasMore
    : !!incomingCursor;

  return {
    items: pageRows,
    pagination: {
      limit,
      hasNextPage,
      hasPreviousPage,
      // nextCursor: client uses this + direction=next to get older posts
      nextCursor: lastCursor,
      // prevCursor: client uses this + direction=prev to get newer posts
      prevCursor: firstCursor,
      // Convenience: cursors of the first/last items on this page
      firstCursor,
      lastCursor,
    },
  };
}