import { atlasSchema } from "../src/schema.ts";
export function validateIntegrity(input) {
  const a = atlasSchema.parse(input);
  const errors = [];
  const assert = (condition, msg) => {
    if (!condition) errors.push(msg);
  };
  const lists = [
    "taxonomy",
    "targets",
    "complexes",
    "pathways",
    "phenotypes",
    "interventions",
    "publications",
    "evidence",
    "relations",
    "sources",
  ];
  const global = new Set();
  for (const list of lists)
    for (const item of a[list]) {
      assert(!global.has(item.id), `重复ID ${item.id}`);
      global.add(item.id);
    }
  const ids = (key) => new Set(a[key].map((x) => x.id));
  const targetIds = ids("targets"),
    pathIds = ids("pathways"),
    pubIds = ids("publications"),
    evIds = ids("evidence"),
    sourceIds = ids("sources"),
    taxonomyIds = ids("taxonomy"),
    phenotypeIds = ids("phenotypes"),
    interventionIds = ids("interventions");
  const nodeIds = new Set([
    ...targetIds,
    ...pathIds,
    ...phenotypeIds,
    ...interventionIds,
    ...ids("complexes"),
  ]);
  const refs = (values, set, label) =>
    values.forEach((id) => assert(set.has(id), `${label}悬空 ${id}`));
  assert(
    a.taxonomy.filter((h) => h.kind === "hallmark").length === 12,
    "分类框架须保留12类初始导航",
  );
  for (const h of a.taxonomy) {
    refs([h.sourceId], sourceIds, "分类出处");
    refs(h.evidenceIds, evIds, "机制证据");
    for (const s of h.sections) refs(s.sourceIds, sourceIds, "机制段落出处");
    if (h.kind === "extension")
      assert(Boolean(h.scopeNote), "扩展机制缺少范围说明");
  }
  for (const t of a.targets) {
    refs(t.taxonomyIds, taxonomyIds, "分类");
    refs(t.pathwayIds, pathIds, "通路");
    refs(t.evidenceIds, evIds, "靶点证据");
    assert(
      t.entityType === "gene_protein" || t.members.length > 0,
      `家族/复合物缺成员 ${t.id}`,
    );
    const es = a.evidence.filter(
      (e) =>
        e.targetId === t.id &&
        t.evidenceIds.includes(e.id) &&
        e.studyContext === "aging_function",
    );
    assert(
      es.some((e) =>
        a.publications.some(
          (p) =>
            p.id === e.publicationId &&
            p.type === "original" &&
            p.metadataVerified &&
            p.claimVerified,
        ),
      ),
      `核心缺少已核验原始研究 ${t.id}`,
    );
    assert(
      es.some((e) =>
        e.evidenceType.some((x) =>
          /遗传|敲|转基因|siRNA|shRNA|药理|功能获得|抑制剂|过表达/.test(x),
        ),
      ),
      `核心缺少功能干预 ${t.id}`,
    );
  }
  const doi = new Set(),
    pmid = new Set(),
    titles = new Set();
  for (const p of a.publications) {
    assert(p.doi || p.pmid, `文献缺稳定标识 ${p.id}`);
    for (const [value, set, label] of [
      [p.doi.toLowerCase(), doi, "DOI"],
      [p.pmid, pmid, "PMID"],
      [p.title.toLowerCase().replace(/[^a-z0-9]/g, ""), titles, "题名"],
    ]) {
      if (value) {
        assert(!set.has(value), `重复${label} ${value}`);
        set.add(value);
      }
    }
    assert(
      !/Retracted Publication|已撤稿/.test(p.correctionStatus),
      `撤稿须从核心移出 ${p.id}`,
    );
  }
  for (const e of a.evidence) {
    refs([e.targetId], targetIds, "证据靶点");
    refs([e.publicationId], pubIds, "证据文献");
    refs(e.phenotypeIds, phenotypeIds, "表型");
    refs(e.interventionIds, interventionIds, "干预");
    assert(
      e.species.every((s) =>
        /Homo sapiens|Mus musculus|Rattus norvegicus|哺乳|人|小鼠|大鼠/.test(s),
      ),
      `超范围物种 ${e.id}`,
    );
    assert(
      e.claim && e.model && e.intervention && e.result && e.locator,
      `证据必要字段缺失 ${e.id}`,
    );
    assert(e.endpoints.length > 0, `无检测指标 ${e.id}`);
  }
  for (const p of a.pathways) {
    refs(p.memberIds, targetIds, "通路成员");
    refs(p.taxonomyIds, taxonomyIds, "通路分类");
    refs(p.backgroundSourceIds, sourceIds, "背景来源");
    refs(p.relationIds, ids("relations"), "通路关系");
    for (const id of p.memberIds)
      assert(
        a.targets.find((t) => t.id === id)?.pathwayIds.includes(p.id),
        `通路双向映射不一致 ${p.id}/${id}`,
      );
  }
  for (const c of a.complexes) {
    refs(c.memberIds, targetIds, "复合物成员");
    refs(c.sourceIds, sourceIds, "复合物来源");
  }
  for (const p of a.phenotypes) refs(p.sourceIds, pubIds, "表型出处");
  for (const i of a.interventions) {
    refs(i.targetIds, targetIds, "干预靶点");
    refs(i.evidenceIds, evIds, "干预证据");
  }
  for (const r of a.relations) {
    refs([r.sourceId, r.targetId], nodeIds, "关系端点");
    refs(r.evidenceIds, evIds, "关系证据");
    refs(r.backgroundSourceIds, sourceIds, "关系背景");
    if (r.scope === "aging_experiment") {
      assert(r.evidenceIds.length > 0, `实验关系无依据 ${r.id}`);
      assert(
        r.evidenceIds.every(
          (id) =>
            a.evidence.find((e) => e.id === id)?.studyContext ===
            "aging_function",
        ),
        `衰老关系混入观察性或非衰老证据 ${r.id}`,
      );
    } else assert(r.backgroundSourceIds.length > 0, `背景关系无出处 ${r.id}`);
    if (r.relationType === "binds")
      assert(
        r.evidenceIds.some((id) =>
          a.evidence
            .find((e) => e.id === id)
            ?.evidenceType.some((x) => /结合|占有|晶体|结构/.test(x)),
        ),
        `直接结合缺相应实验 ${r.id}`,
      );
    if (r.direction === "directed")
      assert(
        r.relationType !== "associated_with" && r.relationType !== "member_of",
        `不确定关联不能画确定性箭头 ${r.id}`,
      );
  }
  const counts = {
    targets: a.targets.length,
    coreGeneProteins: a.targets.filter((t) => t.entityType === "gene_protein")
      .length,
    complexes: a.complexes.length,
    pathways: a.pathways.length,
    evidence: a.evidence.length,
    agingFunctionEvidence: a.evidence.filter(
      (e) => e.studyContext === "aging_function",
    ).length,
    supplementaryEvidence: a.evidence.filter(
      (e) => e.studyContext !== "aging_function",
    ).length,
    publications: a.publications.length,
    originalPublications: a.publications.filter((p) => p.type === "original")
      .length,
    experimentalRelations: a.relations.filter(
      (r) => r.scope === "aging_experiment",
    ).length,
    backgroundRelations: a.relations.filter(
      (r) => r.scope === "pathway_background",
    ).length,
    taxonomy: a.taxonomy.length,
    hallmarks: a.taxonomy.filter((h) => h.kind === "hallmark").length,
    extensionMechanisms: a.taxonomy.filter((h) => h.kind === "extension")
      .length,
    coveredCategories: a.taxonomy.filter(
      (h) =>
        h.kind === "hallmark" &&
        a.targets.some((t) => t.taxonomyIds.includes(h.id)),
    ).length,
  };
  for (const [k, v] of Object.entries(counts))
    assert(a.manifest.counts[k] === v, `统计不一致 ${k}`);
  if (errors.length) throw new Error(errors.join("\n"));
  return {
    status: "passed",
    counts,
    scientificReview:
      "结构和收录约束校验通过，不等于自动核实科学结论或专家审核",
  };
}
