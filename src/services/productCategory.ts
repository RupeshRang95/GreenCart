/** Google-style taxonomy string → pseudo OFF tags for categoryFromOffTags. */
export function categoryFromUpcitemdbPath(path: string | undefined): string[] {
  const t = (path || "").toLowerCase();
  const tags: string[] = [];
  if (/(beverages|soda|water|juice|coffee|tea)/.test(t)) tags.push("en:beverages", "en:groceries");
  if (/(dairy|milk|cheese|yogurt|egg)/.test(t)) tags.push("en:dairies", "en:dairy");
  if (/(meat|fish|seafood|poultry|beef|pork|frozen-meats)/.test(t)) tags.push("en:meats", "en:fish");
  if (/(bread|bakery)/.test(t)) tags.push("en:breads", "en:bakery");
  if (/(produce|fruits|vegetables|fresh)/.test(t)) tags.push("en:fruits-and-vegetables", "en:fresh");
  if (/(snack|candy|chocolate|chips)/.test(t)) tags.push("en:snacks");
  if (/(cereal|rice|pasta|flour|grain)/.test(t)) tags.push("en:cereals");
  if (/(frozen)/.test(t)) tags.push("en:frozen-foods");
  if (tags.length === 0) tags.push("en:groceries");
  return tags;
}
