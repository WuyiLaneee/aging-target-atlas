import type { Atlas, Target, Publication, Relation } from "../schema";
import { makeCSV } from "./core.mjs";
export function download(
  content: BlobPart,
  name: string,
  mime = "application/json;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const el = document.createElement("a");
  el.href = url;
  el.download = name;
  document.body.append(el);
  el.click();
  el.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function exportMeta(a: Atlas, scope: string) {
  return {
    exportedAt: new Date().toISOString(),
    dataVersion: a.manifest.version,
    scope,
  };
}
export function exportData(
  a: Atlas,
  targets: Target[],
  format: "csv" | "json",
  scope: string,
) {
  const ids = new Set(targets.map((t) => t.id));
  const rels = a.relations.filter(
    (r) => ids.has(r.sourceId) || ids.has(r.targetId),
  );
  const es = a.evidence.filter(
    (e) =>
      targets.some((t) => t.evidenceIds.includes(e.id)) ||
      rels.some((r) => r.evidenceIds.includes(e.id)),
  );
  const pathways = a.pathways.filter((p) =>
    targets.some((t) => t.pathwayIds.includes(p.id)),
  );
  const metadata = exportMeta(a, scope);
  const sharedPathways =
    targets.length > 1
      ? pathways.filter((p) =>
          targets.every((t) => t.pathwayIds.includes(p.id)),
        )
      : [];
  const selectionSummary = {
    sharedPathways: sharedPathways.map((p) => ({ id: p.id, name: p.name })),
    uniquePathwaysByTarget: targets.map((t) => ({
      targetId: t.id,
      pathwayIds: t.pathwayIds.filter((id) =>
        targets.every(
          (other) => other.id === t.id || !other.pathwayIds.includes(id),
        ),
      ),
    })),
    verifiedConnectionsWithinSelection: rels.filter(
      (r) =>
        r.scope === "aging_experiment" &&
        ids.has(r.sourceId) &&
        ids.has(r.targetId),
    ),
    interpretation: "共享主题不等于直接调控。未收录连线不表示不存在科学研究。",
  };
  const contextIds = new Set([
    ...rels.flatMap((r) => [r.sourceId, r.targetId]),
    ...pathways.flatMap((p) => p.memberIds),
  ]);
  const payload = {
    metadata,
    targets,
    taxonomy: a.taxonomy.filter((h) =>
      targets.some((t) => t.taxonomyIds.includes(h.id)),
    ),
    pathways,
    selectionSummary,
    evidence: es,
    relations: rels,
    publications: a.publications.filter((p) =>
      es.some((e) => e.publicationId === p.id),
    ),
    phenotypes: a.phenotypes.filter((p) =>
      es.some((e) => e.phenotypeIds.includes(p.id)),
    ),
    interventions: a.interventions.filter((i) =>
      es.some((e) => e.interventionIds.includes(i.id)),
    ),
    relationEndpointEntities: [
      ...a.targets,
      ...a.pathways,
      ...a.phenotypes,
      ...a.interventions,
      ...a.complexes,
    ].filter((e) => contextIds.has(e.id)),
    sources: a.sources,
  };
  if (format === "json")
    download(JSON.stringify(payload, null, 2), "aging-atlas-data.json");
  else
    download(
      makeCSV(
        targets.map((t) => ({
          id: t.id,
          symbol: t.symbol,
          name: t.name,
          entityType: t.entityType,
          mechanisms: t.taxonomyIds.map(
            (id) => a.taxonomy.find((h) => h.id === id)?.name,
          ),
          pathways: t.pathwayIds.map(
            (id) => a.pathways.find((p) => p.id === id)?.name,
          ),
          skin: t.skinSummary,
          summary: t.summary,
          evidenceIds: t.evidenceIds,
          species: es
            .filter((e) => e.targetId === t.id)
            .flatMap((e) => e.species),
          models: es.filter((e) => e.targetId === t.id).map((e) => e.model),
          limitations: es
            .filter((e) => e.targetId === t.id)
            .map((e) => e.limitations),
          sources: es
            .filter((e) => e.targetId === t.id)
            .map((e) => e.sourceUrl),
        })),
        metadata,
      ),
      "aging-atlas-targets.csv",
      "text/csv;charset=utf-8",
    );
}
export function exportRelations(
  a: Atlas,
  relations: Relation[],
  scope: string,
) {
  download(
    makeCSV(relations, exportMeta(a, scope)),
    "aging-atlas-relations.csv",
    "text/csv;charset=utf-8",
  );
}
export function exportPathways(a: Atlas) {
  download(
    makeCSV(a.pathways, exportMeta(a, "通路目录")),
    "aging-atlas-pathways.csv",
    "text/csv;charset=utf-8",
  );
}
export function ris(pubs: Publication[], a: Atlas, scope: string) {
  const text = pubs
    .map((p) =>
      [
        "TY  - JOUR",
        `TI  - ${p.title}`,
        ...p.authors.map((x) => `AU  - ${x}`),
        `PY  - ${p.year}`,
        `JO  - ${p.journal}`,
        p.doi ? `DO  - ${p.doi}` : "",
        p.pmid ? `AN  - PMID:${p.pmid}` : "",
        `UR  - ${p.url}`,
        `N1  - ${JSON.stringify(exportMeta(a, scope))}`,
        "ER  - ",
        "",
      ]
        .filter(Boolean)
        .join("\r\n"),
    )
    .join("\r\n\r\n");
  download(
    text,
    "aging-atlas-references.ris",
    "application/x-research-info-systems;charset=utf-8",
  );
}
export const citation = (p: Publication) =>
  `${p.authors.join(", ")}. ${p.title} ${p.journal}. ${p.year}. ${p.doi ? "doi: " + p.doi + ". " : ""}${p.pmid ? "PMID: " + p.pmid : ""}`;
