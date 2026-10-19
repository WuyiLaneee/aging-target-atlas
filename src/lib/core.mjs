export const normalize = (value) =>
  String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[αΑ]/g, "alpha")
    .replace(/[βΒ]/g, "beta")
    .replace(/[κΚ]/g, "kappa")
    .replace(/[‐‑–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
export function csvCell(value) {
  let s = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function makeCSV(rows, metadata) {
  const cols = [...new Set(rows.flatMap(Object.keys))];
  return (
    "\ufeff" +
    [
      cols.map(csvCell).join(","),
      ...rows.map((row) => cols.map((k) => csvCell(row[k])).join(",")),
      "",
      ...Object.entries(metadata).map(([k, v]) =>
        [k, v].map(csvCell).join(","),
      ),
    ].join("\r\n")
  );
}
export function validateBackup(value) {
  if (
    !value ||
    value.app !== "aging-target-pathway-atlas" ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.favorites) ||
    !value.notes ||
    typeof value.notes !== "object" ||
    Array.isArray(value.notes)
  )
    throw new Error("不是有效的图谱笔记备份（格式或版本不匹配）。");
  if (value.favorites.length > 10000 || Object.keys(value.notes).length > 10000)
    throw new Error("记录数超过限制。");
  const validId = (id) =>
    typeof id === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(id) &&
    !["__proto__", "constructor", "prototype"].includes(id);
  if (
    !value.favorites.every(validId) ||
    Object.entries(value.notes).some(
      ([k, v]) => !validId(k) || typeof v !== "string" || v.length > 100000,
    )
  )
    throw new Error("备份记录包含无效 ID 或笔记。");
  return {
    app: value.app,
    schemaVersion: 1,
    favorites: [...new Set(value.favorites)],
    notes: { ...value.notes },
  };
}
export function mergeBackup(current, incoming) {
  return {
    app: current.app,
    schemaVersion: 1,
    favorites: [...new Set([...current.favorites, ...incoming.favorites])],
    notes: { ...incoming.notes, ...current.notes },
  };
}
export function selectLocalRelations(
  relations,
  root,
  depth = 1,
  mode = "all",
  cap = 40,
) {
  const nodes = new Set([root]);
  const selected = new Map();
  let frontier = new Set([root]);
  for (let i = 0; i < Math.min(depth, 2); i++) {
    const next = new Set();
    for (const r of relations) {
      const matches =
        mode === "upstream"
          ? r.direction === "directed" && frontier.has(r.targetId)
          : mode === "downstream"
            ? r.direction === "directed" && frontier.has(r.sourceId)
            : mode === "pathway"
              ? r.relationType === "member_of" &&
                (frontier.has(r.sourceId) || frontier.has(r.targetId))
              : frontier.has(r.sourceId) || frontier.has(r.targetId);
      if (!matches || selected.size >= cap) continue;
      selected.set(r.id, r);
      nodes.add(r.sourceId);
      nodes.add(r.targetId);
      next.add(r.sourceId);
      next.add(r.targetId);
    }
    frontier = next;
  }
  return { nodeIds: [...nodes], relations: [...selected.values()] };
}
