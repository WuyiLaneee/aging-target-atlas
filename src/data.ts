import { atlasSchema, type Atlas, type Target } from "./schema";
import { normalize } from "./lib/core.mjs";
export async function loadAtlas(): Promise<Atlas> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/atlas.json`);
  if (!response.ok)
    throw new Error(
      `科研数据加载失败（HTTP ${response.status}），请检查网络或发布路径。`,
    );
  return atlasSchema.parse(await response.json());
}
export const skinLabels: Record<string, string> = {
  skin_aging: "皮肤衰老实验",
  skin_damage: "皮肤相关损伤",
  other_tissue: "其他组织研究",
  not_assessed: "皮肤关联尚未评估",
};
export function targetCorpus(t: Target, a: Atlas) {
  const es = a.evidence.filter((e) => t.evidenceIds.includes(e.id));
  return normalize(
    [
      t.symbol,
      t.name,
      ...t.aliases,
      t.summary,
      ...t.pathwayIds.map((id) => a.pathways.find((p) => p.id === id)?.name),
      ...es.flatMap((e) => [
        e.claim,
        e.model,
        e.tissueCell,
        ...e.species,
        ...e.endpoints,
        a.publications.find((p) => p.id === e.publicationId)?.title,
      ]),
    ].join(" "),
  );
}
export function entity(a: Atlas, id: string) {
  return [
    ...a.targets,
    ...a.pathways,
    ...a.phenotypes,
    ...a.interventions,
    ...a.complexes,
  ].find((t) => t.id === id);
}
