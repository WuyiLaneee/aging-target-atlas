import fs from "node:fs";
const a = JSON.parse(fs.readFileSync("public/data/atlas.json", "utf8"));
const c = a.manifest.counts;
const url = "https://wuyilaneee.github.io/aging-target-atlas/#";
const out = [
  "# 抗衰靶点与通路覆盖清单",
  "",
  `数据版本 ${a.manifest.version} · ${a.manifest.updated}`,
  "",
  "范围：人和其他哺乳动物的衰老研究。采用 Cell 2023 的 12 类衰老标志，并单列 ECM。核心分子靶点按原始功能实验收录；整体干预、观察关联和补充实验按研究主题分别列出。",
  "",
  `现已收录 **${c.targets} 个核心靶点、${c.pathways} 个通路与研究主题、${c.originalPublications} 篇原始研究**；含 ${c.evidence} 条靶点证据和 ${c.themeStudies} 条主题证据。共有 ${c.coveredCategories}/${c.hallmarks} 类衰老标志具备研究记录。`,
  "",
  "每个主题的通路页以实验记录为单位列出模型、干预、结果和对应原始论文。补录候选按主题列出，同一靶点可已收录在其他主题下。",
  "",
  "| 分类 | 覆盖主题 | 已收录的通路或主题（论文数） | 核心靶点 / 补录候选 |",
  "|---|---|---|---|",
];
for (const section of a.coveragePlan) {
  const h = a.taxonomy.find((x) => x.id === section.taxonomyId);
  for (const topic of section.topics) {
    const paths = topic.pathwayIds.map((id) => a.pathways.find((p) => p.id === id));
    const linked = paths.map((p) => {
      const ids = new Set([
        ...a.evidence.filter((e) => e.pathwayIds.includes(p.id)),
        ...a.themeStudies.filter((e) => e.pathwayId === p.id),
      ].map((e) => e.publicationId));
      return `[${p.name}](${url}/pathways/${p.id})（${ids.size}）`;
    });
    const targets = topic.candidateSymbols.map((s) => {
      const t = a.targets.find((t) => t.symbol === s && t.taxonomyIds.includes(h.id) && paths.some((p) => a.evidence.some((e) => e.targetId === t.id && e.pathwayIds.includes(p.id))));
      return t ? {s, label: `[${s}](${url}/targets/${t.id})`} : {s};
    });
    const core = targets.filter((x) => x.label).map((x) => x.label);
    const pending = targets.filter((x) => !x.label).map((x) => x.s);
    out.push(`| ${h.name} | ${topic.name} | ${linked.join("；") || "主题待整理"} | ${[core.length && "已收录：" + core.join("、"), pending.length && "候选：" + pending.join("、")].filter(Boolean).join("；") || "主题证据"} |`);
  }
}
fs.writeFileSync("docs/DATA_COVERAGE.md", out.join("\n") + "\n");
