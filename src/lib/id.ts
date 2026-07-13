/**
 * Collision-resistant id generator for locally-created records.
 *
 * A full UUID dependency is overkill for device-local data; a timestamp plus
 * random suffix is unique enough and keeps ids sortable by creation time.
 */
export function createId(prefix = 'al'): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);

  return `${prefix}_${time}${random}`;
}
