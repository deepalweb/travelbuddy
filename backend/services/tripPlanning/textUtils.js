export function toStringArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
}

export function compactList(items = [], limit = 8) {
  return items.filter(Boolean).slice(0, limit);
}
