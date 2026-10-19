import fs from "node:fs";
const a = JSON.parse(fs.readFileSync("public/data/atlas.json", "utf8"));
const c = a.manifest.counts;
const skin = a.targets.filter((t) => t.skinClassification === "skin_aging");
const body = `# 数据覆盖与缺口\n\n版本 ${a.manifest.version}；整理日期 ${a.manifest.updated}。\n\n## 实际收录\n\n| 项目 | 数量 |\n|---|---:|\n| 核心具体基因 / 蛋白 | ${c.coreGeneProteins} |\n| 原始功能研究 | ${c.originalPublications} |\n| 框架综述 | ${a.publications.filter((p) => p.type === "review").length} |\n| 实验依据记录 | ${c.evidence} |\n| 通路 / 研究主题 | ${c.pathways} |\n| 辅助复合物（不计核心靶点） | ${c.complexes} |\n| 衰老功能实验关系 | ${c.experimentalRelations} |\n| 其中跨核心靶点功能关系 | ${a.relations.filter((r) => r.scope === "aging_experiment" && a.targets.some((t) => t.id === r.sourceId) && a.targets.some((t) => t.id === r.targetId)).length} |\n| 机制背景 / 研究主题关系 | ${c.backgroundRelations} |\n| 有直接皮肤衰老相关实验的条目 | ${skin.length} |\n| 已有条目的分类 / 完整导航 | ${c.coveredCategories} / 12 |\n\n皮肤条目：${skin.map((t) => t.symbol).join("、")}。每个条目内部仍包含不同模型，不能把其全部证据均当作皮肤特异。尤其 MAPK14 的 HCA2 核心片段未实核组织来源，皮肤映射依据另一篇真皮成纤维细胞研究；STING1 人皮肤细胞辐射诱导衰老与自然人体老化分开。\n\n核心符号：${a.targets
  .map((t) => t.symbol)
  .sort()
  .join(
    "、",
  )}。\n\n## 分类框架与条目进度分别报告\n\n框架 12 类全部建立；已收录条目分布如下。一个靶点可归属多类，分类数量不能相加为总靶点数。\n\n| 分类 | 具体靶点数 | 状态 |\n|---|---:|---|\n${a.taxonomy
  .map((h) => {
    const n = a.targets.filter((t) => t.taxonomyIds.includes(h.id)).length;
    return `| ${h.number}. ${h.name} | ${n} | ${n ? "部分整理" : "尚未完成整理"} |`;
  })
  .join("\n")}\n\n${a.manifest.coverage}\n\n## 访问范围\n\n${a.publications
  .filter((p) => p.type === "original")
  .map((p) => `- PMID ${p.pmid}：${p.accessScope}；${p.correctionStatus}`)
  .join(
    "\n",
  )}\n\n## 已知缺口\n\n${a.manifest.gaps.map((g) => "- " + g).join("\n")}\n\n## 下批可执行方向\n\n- 补核 FOXO3 的单基因、年龄特异性哺乳动物功能证据；不因仅检得家族删除研究就自动纳入。\n- 按微生物群失衡主题追溯哺乳动物靶点干预，区分菌群组成关联、宿主功能依赖与整体干预。\n- 优先扩充皮肤自然老化原位与完整对照的靶点依赖研究；继续分开光损伤、衰老与外用功效。\n- 完善上下游连线、更多反例、同源标识及更正来源；依据原文逐条入库，不能用计算网络补齐。\n\n本文件由 scripts/write-coverage.mjs 按正式数据生成；科学核验状态不由数量或结构检查自动升级。\n`;
fs.writeFileSync("docs/DATA_COVERAGE.md", body);
console.log("已按正式数据更新 DATA_COVERAGE.md");
