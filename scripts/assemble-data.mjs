import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import { atlasSchema } from "../src/schema.ts";
const date = "2026-10-19";
const version = "1.1.0";
const read = (p) =>
  JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const batches = [
  "skin",
  "longevity",
  "mechanism",
  "ecm-ccn1",
  "ecm-col17",
  "ecm-mmp1",
].map((x) => read(`research/${x}-research.json`));
const unique = (arr) => [...new Set(arr)];
const idFor = (prefix, name) =>
  `${prefix}-${crypto.createHash("sha256").update(name.normalize("NFKC")).digest("hex").slice(0, 12)}`;
const source = (id, name, url, role) => ({
  id,
  name,
  url,
  role,
  checkedDate: date,
});
const a = {
  taxonomy: [],
  targets: [],
  pathways: [],
  phenotypes: [],
  interventions: [],
  publications: [],
  evidence: [],
  relations: [],
  complexes: [],
  sources: [],
  manifest: {},
};
a.sources = [
  source(
    "src-hallmarks",
    "Cell 2023：Hallmarks of aging: An expanding universe",
    "https://pubmed.ncbi.nlm.nih.gov/36599349/",
    "12 类工作框架；综述只作框架，不替代原始功能实验。",
  ),
  source(
    "src-reactome-s6k",
    "Reactome：mTORC1 phosphorylation of RPS6KB1 (S6K)",
    "https://reactome.org/content/detail/R-HSA-165718",
    "人工整理的人类机制背景反应 R-HSA-165718；核对网页物种、反应及成员。不是特定衰老或皮肤模型的实验因果边。",
  ),
  source(
    "src-reactome-policy",
    "Reactome 跨物种推断说明与许可",
    "https://reactome.org/documentation/inferred-events",
    "人类事件与同源推断分别解释。许可另见 https://reactome.org/license；未批量导入数据库。",
  ),
  source(
    "src-genage",
    "GenAge / HAGR 使用说明",
    "https://genomics.senescence.info/help.html",
    "候选与原始文献追溯入口；本批未整体导入其记录。",
  ),
  source(
    "src-cellage",
    "CellAge：Cell Senescence Gene Database",
    "https://genomics.senescence.info/cells/index.html",
    "功能干预候选入口；本批不把表达特征列表当成核心集。",
  ),
  source(
    "src-pubmed",
    "PubMed / NCBI",
    "https://pubmed.ncbi.nlm.nih.gov/",
    "书目和稳定 PMID 核对；访问摘要或图注时如实记录范围。",
  ),
  source(
    "src-epmc",
    "Europe PMC",
    "https://europepmc.org/",
    "合法可访问正文、摘要和元数据核验；不绕过访问控制，不转载全文。",
  ),
];
const names = [
  "基因组不稳定性",
  "端粒耗损",
  "表观遗传改变",
  "蛋白质稳态丧失",
  "宏自噬受损",
  "营养感知失调",
  "线粒体功能障碍",
  "细胞衰老",
  "干细胞耗竭",
  "细胞间通讯改变",
  "慢性炎症",
  "微生物群失衡",
];
const en = [
  "Genomic instability",
  "Telomere attrition",
  "Epigenetic alterations",
  "Loss of proteostasis",
  "Disabled macroautophagy",
  "Deregulated nutrient-sensing",
  "Mitochondrial dysfunction",
  "Cellular senescence",
  "Stem cell exhaustion",
  "Altered intercellular communication",
  "Chronic inflammation",
  "Dysbiosis",
];
a.taxonomy = names.map((name, i) => ({
  id: `hallmark-${String(i + 1).padStart(2, "0")}`,
  name,
  englishName: en[i],
  number: i + 1,
  description:
    "以 Cell 2023 工作框架为导航；跨分类主题归属不表示已经证明特定因果作用。",
  sourceId: "src-hallmarks",
  version: "Cell-2023-v1",
  kind: "hallmark",
  color: [
    "#6b9980",
    "#87a588",
    "#94a287",
    "#809aa4",
    "#7e9a89",
    "#7b9c93",
    "#a99b70",
    "#8a9f7b",
    "#7d9c76",
    "#819f96",
    "#b49c79",
    "#91a385",
  ][i],
}));
const ecm = read("research/ecm-mechanism.json");
const { symbols: ecmSymbols, existingEvidenceIds, ...ecmTaxonomy } = ecm;
a.taxonomy.push({ ...ecmTaxonomy, evidenceIds: [] });
a.sources.push(
  source(
    "src-ecm-framework",
    "ECM 扩展导航：皮肤衰老的细胞—基质研究主题",
    "https://pubmed.ncbi.nlm.nih.gov/29455303/",
    "综述作为背景与追溯入口；ECM 为本站扩展主题，不属于 Cell 2023 原始12项标志。具体功能主张引用各原始实验。",
  ),
);
const taxonomyId = (n) => `hallmark-${String(n).padStart(2, "0")}`;
const access = (s) =>
  s === "abstract"
    ? "依据摘要"
    : s === "full_text"
      ? "全文（相关结果与图注）"
      : s || "当前未获取";
const skin = (r) =>
  /other_tissue|其他组织/.test(r.skinClassification)
    ? "other_tissue"
    : /not_assessed|尚未评估/.test(r.skinClassification)
      ? "not_assessed"
      : r.symbol === "MAPK14"
        ? "skin_damage"
        : /皮肤|skin_aging/.test(r.skinClassification)
          ? "skin_aging"
          : r.skinClassification;
const species = (s) =>
  /Mus musculus|小鼠/.test(s)
    ? "小鼠（Mus musculus）"
    : /Homo sapiens|人类|^人$/.test(s)
      ? "人（Homo sapiens）"
      : /Rattus norvegicus|大鼠/.test(s)
        ? "大鼠（Rattus norvegicus）"
        : s;
const status = (s) =>
  ({
    supports: "支持",
    opposes: "反对概括性主张",
    contradicts: "相反结果",
    conditional: "条件依赖",
  })[s] || s;
const pubMap = new Map();
for (const b of batches)
  for (const p of b.publications) {
    const old = pubMap.get(p.id);
    if (old && old.doi?.toLowerCase() !== p.doi?.toLowerCase())
      throw Error(`书目冲突 ${p.id}`);
    pubMap.set(p.id, {
      ...p,
      accessScope: access(p.accessScope),
      type: "original",
      doi: p.doi || "",
      pmid: p.pmid || "",
      authors: Array.isArray(p.authors) ? p.authors : [String(p.authors)],
      correctionStatus: p.correctionStatus || "当前未完成更正 / 撤稿核查",
      checkedDate: date,
    });
  }
pubMap.set("pub-36599349", {
  id: "pub-36599349",
  title: "Hallmarks of aging: An expanding universe",
  authors: [
    "Carlos López-Otín",
    "Maria A Blasco",
    "Linda Partridge",
    "Manuel Serrano",
    "Guido Kroemer",
  ],
  year: 2023,
  journal: "Cell",
  doi: "10.1016/j.cell.2022.11.001",
  pmid: "36599349",
  url: "https://pubmed.ncbi.nlm.nih.gov/36599349/",
  accessScope: "依据摘要（分类框架）",
  metadataVerified: true,
  claimVerified: false,
  checkedDate: date,
  correctionStatus: "本批核对框架和书目，未实施完整更正审计",
  type: "review",
});
a.publications = [...pubMap.values()].map((p) => ({
  id: p.id,
  title: p.title,
  authors: p.authors,
  year: p.year,
  journal: p.journal,
  doi: p.doi,
  pmid: p.pmid,
  url: p.url,
  accessScope: p.accessScope,
  metadataVerified: p.metadataVerified,
  claimVerified: p.claimVerified,
  checkedDate: p.checkedDate,
  correctionStatus: p.correctionStatus,
  type: p.type,
}));
for (const p of a.publications)
  a.sources.push(
    source(
      "source-" + p.id,
      p.title,
      p.url,
      p.type === "original"
        ? "原始研究；具体访问范围见文献与证据记录。归属连线引用时仅表示整理者依据该文建立的研究主题映射。"
        : "框架综述；不作核心功能验证。",
    ),
  );
const allRecords = batches.flatMap((b) => b.records);
if (unique(allRecords.map((r) => r.symbol)).length !== allRecords.length)
  throw Error("靶点重复，需人工合并后再组装。");
for (const r of allRecords) {
  const id = "target-" + r.symbol.toLowerCase();
  const externalIds = Array.isArray(r.externalIds)
    ? r.externalIds
    : Object.entries(r.externalIds || {}).map(([db, value]) => ({
        database: /hgnc/i.test(db) ? "HGNC" : "NCBI Gene",
        id: String(value),
        url: /hgnc/i.test(db)
          ? r.identitySourceUrl ||
            `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${value}`
          : r.ncbiGeneUrl || `https://www.ncbi.nlm.nih.gov/gene/${value}`,
        checkedDate: date,
      }));
  const target = {
    id,
    name: r.chineseName,
    symbol: r.symbol,
    entityType: ["family", "complex"].includes(r.entityType)
      ? r.entityType
      : "gene_protein",
    aliases: unique(r.aliases || []),
    externalIds,
    members: r.members || [],
    orthologMapping:
      r.orthologMapping ||
      "按标准符号汇总对应研究主题；原始物种及实际实验实体见每条证据。未完成全库同源数据库逐一映射，不把鼠基因名改写为人实验。",
    summary: r.summary,
    taxonomyIds: unique([
      ...(r.hallmarks || []).map(taxonomyId),
      ...(ecmSymbols.includes(r.symbol) ? [ecm.id] : []),
    ]),
    pathwayIds: [],
    skinClassification: skin(r),
    skinSummary: r.skinSummary,
    evidenceIds: [],
    status: "core",
  };
  if (r.symbol === "MAPK14") {
    target.skinClassification = "skin_aging";
    target.skinSummary =
      r.skinSummary +
      " 核心 HCA2 来源未实核；皮肤归类依据另篇已核对的老年 / Werner 综合征真皮成纤维细胞衰老研究，不能把全部实验称作皮肤特异。";
  }
  a.targets.push(target);
  for (const [i, e] of r.evidence.entries()) {
    const eid = e.id || `evidence-${r.symbol.toLowerCase()}-${i + 1}`;
    const phenotypeIds = [];
    for (const name of e.phenotypes || []) {
      const pid = idFor("phenotype", name);
      phenotypeIds.push(pid);
      let ph = a.phenotypes.find((p) => p.id === pid);
      if (!ph) {
        ph = {
          id: pid,
          name,
          level: /寿命|lifespan/.test(name)
            ? "机体寿命"
            : /衰弱|组织|认知|生殖/.test(name)
              ? "组织 / 机体功能"
              : /干细胞/.test(name)
                ? "细胞 / 再生功能"
                : "细胞 / 分子表型",
          definition: `原始研究中的“${name}”相关终点；具体操作定义、检测指标和方向见引用证据，不作为统一量化分数。`,
          sourceIds: [],
        };
        a.phenotypes.push(ph);
      }
      ph.sourceIds = unique([...ph.sourceIds, e.publicationId]);
    }
    const interventionIds = [];
    if (e.interventionName) {
      const n =
        typeof e.interventionName === "string"
          ? e.interventionName
          : e.interventionName.name;
      const iid = idFor("intervention", n);
      interventionIds.push(iid);
      let iv = a.interventions.find((x) => x.id === iid);
      if (!iv) {
        iv = {
          id: iid,
          name: n,
          category:
            e.interventionCategory ||
            (/siRNA|shRNA|病毒|基因/.test(n)
              ? "遗传工具"
              : "研究用药理分子 / 原料"),
          identity:
            "身份以关联原始论文中的名称和处理为依据；未核实的 CAS / 外部化学 ID 不填写。",
          targetIds: [],
          evidenceIds: [],
          route: e.intervention,
        };
        a.interventions.push(iv);
      }
      iv.targetIds = unique([...iv.targetIds, id]);
      iv.evidenceIds = unique([...iv.evidenceIds, eid]);
    }
    const ev = {
      id: eid,
      targetId: id,
      publicationId: e.publicationId,
      claim: e.claim,
      evidenceType: e.evidenceType,
      species: unique(e.species.map(species)),
      actualEntity: e.actualEntity,
      tissueCell: e.tissueCell,
      model: e.model,
      intervention: e.intervention,
      result: e.result,
      endpoints: e.endpoints,
      conditions: e.conditions,
      limitations: e.limitations,
      supportStatus: status(e.supportStatus),
      locator: e.locator,
      accessScope: access(e.accessScope),
      sourceUrl: e.sourceUrl,
      phenotypeIds,
      interventionIds,
      dose: e.dose || "当前未获取",
      time: e.time || "当前未获取",
      sampleSize: e.sampleSize || "当前未获取",
      studyContext: e.studyContext || "aging_function",
    };
    a.evidence.push(ev);
    target.evidenceIds.push(eid);
    for (const pid of ev.studyContext === "aging_function" ? phenotypeIds : [])
      a.relations.push({
        id: `rel-${eid}-${pid}`,
        sourceId: id,
        targetId: pid,
        relationType: "associated_with",
        polarity: "unknown",
        directness:
          "特定干预与实验表型的功能关联；不宣称恒定分子活性方向或直接物理作用。",
        evidenceIds: [eid],
        backgroundSourceIds: [],
        context: `${ev.model}；干预：${ev.intervention}；结果：${ev.result}；${ev.conditions}`,
        scope: "aging_experiment",
        label: "干预后表型（见条件）",
        direction: "undirected",
      });
    for (const iid of ev.studyContext === "aging_function"
      ? interventionIds
      : [])
      a.relations.push({
        id: `rel-${eid}-${iid}`,
        sourceId: iid,
        targetId: id,
        relationType: "indirect",
        polarity: "unknown",
        directness:
          "实验处理与该条目功能主张的关联；药理关联不自动证明直接结合或特异性。",
        evidenceIds: [eid],
        backgroundSourceIds: [],
        context: `${ev.intervention}；${ev.model}；${ev.limitations}`,
        scope: "aging_experiment",
        label: "药理 / 处理关联",
        direction: "undirected",
      });
  }
}
const pathways = read("research/pathway-curation.json");
for (const p of pathways) {
  const members = a.targets.filter((t) => p.symbols.includes(t.symbol));
  const sourceIds = unique(
    a.evidence
      .filter((e) => members.some((t) => t.id === e.targetId))
      .map((e) => "source-" + e.publicationId),
  );
  a.pathways.push({
    id: p.id,
    name: p.name,
    summary: p.summary,
    memberIds: members.map((t) => t.id),
    taxonomyIds: [...p.hallmarks.map(taxonomyId), ...(p.mechanismIds || [])],
    backgroundSourceIds: sourceIds,
    relationIds: [],
    mappingBasis:
      "整理者依据入库原始研究建立的研究主题映射；不宣称这是完整数据库通路或全部成员。分子调控边须另外核对。",
  });
  for (const t of members) {
    t.pathwayIds.push(p.id);
    const r = {
      id: `rel-member-${t.id}-${p.id}`,
      sourceId: t.id,
      targetId: p.id,
      relationType: "member_of",
      polarity: "not_applicable",
      directness: "编辑研究主题映射，不代表已验证因果调控。",
      evidenceIds: [],
      backgroundSourceIds: unique(
        a.evidence
          .filter((e) => e.targetId === t.id)
          .map((e) => "source-" + e.publicationId),
      ),
      context:
        "基于本条原始研究的主题归属；通路机制背景，不计入衰老实验因果边。",
      scope: "pathway_background",
      label: "研究主题归属",
      direction: "undirected",
    };
    a.relations.push(r);
    a.pathways.at(-1).relationIds.push(r.id);
  }
}
// Only accept the cross-target suggestion explicitly read in the primary experiment.
const cgas = a.evidence.find((e) => e.id === "ev-CGAS-37532932");
if (cgas)
  a.relations.push({
    id: "rel-cgas-sting-functional",
    sourceId: "target-cgas",
    targetId: "target-sting1",
    relationType: "indirect",
    polarity: "positive",
    directness: "间接功能关系：STING 抑制剂 H-151 救援；不代表两蛋白直接结合。",
    evidenceIds: [cgas.id],
    backgroundSourceIds: [],
    context: `小胶质细胞 Cgas R241E 功能获得；H-151 救援。${cgas.conditions} ${cgas.limitations}`,
    scope: "aging_experiment",
    label: "功能获得 / H-151救援",
    direction: "directed",
  });
// mTORC1 is an auxiliary complex, never counted as a core gene target.
for (const file of [
  "research/skin-relations.json",
  "research/mechanism-relations.json",
]) {
  for (const [i, r] of read(file).entries()) {
    const ev = a.evidence.find((e) => e.id === r.evidenceId);
    if (!ev) throw Error("跨靶点关系缺少依据 " + r.evidenceId);
    a.relations.push({
      id: `rel-functional-${r.sourceSymbol.toLowerCase()}-${r.targetSymbol.toLowerCase()}-${r.evidenceId}`,
      sourceId: "target-" + r.sourceSymbol.toLowerCase(),
      targetId: "target-" + r.targetSymbol.toLowerCase(),
      relationType:
        r.sourceSymbol === "ATM" && r.targetSymbol === "SIRT6"
          ? "phosphorylates"
          : r.relationType,
      polarity: r.polarity,
      directness: r.directness,
      evidenceIds: [r.evidenceId],
      backgroundSourceIds: [],
      context: r.context,
      label: r.label,
      direction: r.direction,
      scope: "aging_experiment",
    });
  }
}
a.complexes = [
  {
    id: "complex-mtorc1",
    name: "mTOR 复合物 1（mTORC1）",
    entityType: "complex",
    summary:
      "由 MTOR 等成员组成的复合物；本版只为 Reactome 背景反应保留实体粒度，不计入核心靶点。",
    memberIds: ["target-mtor"],
    membersNote: "仅映射当前已入库 MTOR，非完整复合物组成清单。",
    sourceIds: ["src-reactome-s6k"],
  },
];
a.relations.push({
  id: "rel-mtor-member-complex",
  sourceId: "target-mtor",
  targetId: "complex-mtorc1",
  relationType: "member_of",
  polarity: "not_applicable",
  directness: "复合物成员归属",
  evidenceIds: [],
  backgroundSourceIds: ["src-reactome-s6k"],
  context:
    "Reactome R-HSA-165718 催化实体为 active mTORC1 complex；不能把 MTOR 单蛋白等同复合物。",
  scope: "pathway_background",
  label: "复合物成员",
  direction: "undirected",
});
a.relations.push({
  id: "rel-mtorc1-s6k-background",
  sourceId: "complex-mtorc1",
  targetId: "target-rps6kb1",
  relationType: "activates",
  polarity: "positive",
  directness: "数据库整理的催化磷酸化背景反应",
  evidenceIds: [],
  backgroundSourceIds: ["src-reactome-s6k"],
  context:
    "Reactome R-HSA-165718，人类事件。mTORC1 磷酸化 p70 S6K1 Thr389 / p85 Thr412；本背景边不证明在当前皮肤或衰老模型中的完整因果链。",
  scope: "pathway_background",
  label: "磷酸化 T389 / T412",
  direction: "directed",
});
const ecmEntry = a.taxonomy.find((t) => t.id === ecm.id);
ecmEntry.evidenceIds = a.evidence
  .filter(
    (e) =>
      existingEvidenceIds.includes(e.id) ||
      a.targets.some(
        (t) =>
          ["CCN1", "COL17A1", "MMP1"].includes(t.symbol) && t.id === e.targetId,
      ),
  )
  .map((e) => e.id);
for (const section of ecmEntry.sections) {
  if (section.id === "ecm-basement-adhesion")
    section.sourceIds = unique(
      a.evidence
        .filter((e) => e.targetId === "target-col17a1")
        .map((e) => "source-" + e.publicationId),
    );
  if (section.id === "ecm-context")
    section.sourceIds = unique([
      ...section.sourceIds,
      ...a.evidence
        .filter((e) => e.targetId === "target-ccn1")
        .map((e) => "source-" + e.publicationId),
    ]);
}
a.manifest = {
  version,
  updated: date,
  counts: {
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
  },
  coverage:
    "目的性检索建立的核心研究库；保留 Cell 2023 的12类标志，另设细胞外基质（ECM）扩展机制，分别统计。条目分布以实时数据为准，非系统综述或完整抗衰靶点名录。",
  gaps: [
    "微生物群失衡尚未完成核心靶点整理，不能据此断言无研究。",
    "尚缺系统性的人体干预证据、皮肤原位研究、剂量时程完整比较与多种族队列。",
    "部分论文仅依据摘要或图注；未获取的剂量、时长和样本量保持明确缺失。",
    "未完成全部条目的外部同源 ID 映射与逐出版商 Crossmark 审计；更正状态按实际访问范围记录。",
    "调控边采用保守收录，首版以干预–表型关系、一个核对过的跨靶点功能关系和主题映射为主，不能作为完整上下游网络。",
    "检索包含 2025–2026 新研究线索与 2026 cGAS 相反结果，但未覆盖截至整理日期的全部新文献。",
  ],
  reviewStatus:
    "Codex 联网整理并核对实际可访问原始内容；未经独立人工专家审核。结构校验不等于科学结论已被自动证明。",
  searchScope:
    "哺乳动物功能研究，目的性检索；无年份下限，按靶点扩展 aging / ageing / senescence / lifespan / healthspan。研究情境、物种和访问范围逐条记录。",
};
// Use counts rather than a fixed prose number when curated edges are expanded.
a.manifest.gaps = a.manifest.gaps.map((g) =>
  g.startsWith("调控边")
    ? "调控边采用保守收录，首版以干预–表型关系、少量原文核对过的跨靶点功能关系和主题映射为主，不能作为完整上下游网络。"
    : g,
);
const parsed = atlasSchema.parse(a);
fs.mkdirSync("public/data", { recursive: true });
fs.writeFileSync(
  "public/data/atlas.json",
  JSON.stringify(parsed, null, 2) + "\n",
);
fs.writeFileSync(
  "public/data/atlas.schema.json",
  JSON.stringify(z.toJSONSchema(atlasSchema), null, 2) + "\n",
);
const log = [
  {
    date,
    source: "PubMed / 官方开发文档",
    query:
      "Hallmarks of aging expanding universe；Reactome R-HSA-165718；Vite static deploy；GitHub Actions Pages；Cytoscape.js",
    result:
      "框架摘要核对 12 项；Reactome 人类反应及复合物成员；Vite/GitHub/Router/Cytoscape 官方文档。近期综述 PMID 42765942、41690118 用作前沿检索线索，不作核心验证。",
    decision: "框架和数据库背景分开保存；不把综述作为靶点功能证据。",
  },
  ...batches.flatMap((b) => b.searchLog),
];
fs.writeFileSync(
  "public/data/search-log.json",
  JSON.stringify(log, null, 2) + "\n",
);
for (const key of [
  "taxonomy",
  "targets",
  "pathways",
  "phenotypes",
  "interventions",
  "publications",
  "evidence",
  "relations",
  "complexes",
  "manifest",
])
  fs.writeFileSync(
    `public/data/${key}.json`,
    JSON.stringify(parsed[key], null, 2) + "\n",
  );
console.log(JSON.stringify(parsed.manifest, null, 2));
