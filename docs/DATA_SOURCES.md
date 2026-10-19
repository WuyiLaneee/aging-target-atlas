# 数据来源、实际检索与复用

整理日期：2026-10-19。首版采用目的性检索，不是 PRISMA 系统综述，不能宣称覆盖所有截至该日期的研究。

## 可追溯记录

- [正式检索记录](../public/data/search-log.json)：实际查询、来源、结果、纳入/排除/待核验决定；不写未执行的阴性结论。
- `research/skin-research.json`、`longevity-research.json`、`mechanism-research.json`：逐项提取及更正、访问限制记录。
- `research/*-relations.json`：跨靶点关系的原始依据、条件与定位。
- `research/pathway-curation.json`：整理者建立的研究主题映射，明确与完整数据库通路区分。
- `public/data/publications.json` 与 `evidence.json`：正式发布的文献状态和提取结论状态。

检索以原始文献和官方 API 为一手来源，利用 PubMed、Europe PMC/PMC 和出版商页面核对标题、作者、年份、期刊、DOI/PMID；皮肤组另用 HGNC，机制组用 NCBI Gene 核对规范符号和身份。官方符号 CGAS、STING1 与旧名 MB21D1、TMEM173 区分；BUB1B 不与 BUB1 混同，KL 不与 KLB 混同。

## 来源分工

| 来源 | 本版用途 | 边界 |
|---|---|---|
| [PubMed](https://pubmed.ncbi.nlm.nih.gov/) | 稳定标识、元数据、摘要、可得图注、更正关联 | DOI 可打开不等于全部结论已核对 |
| [Europe PMC](https://europepmc.org/) / [PMC](https://pmc.ncbi.nlm.nih.gov/) | 合法开放正文与图注的相关结果核对 | 只记录实际获取范围；遇验证码/限制不绕过 |
| [HGNC](https://www.genenames.org/) / [NCBI Gene](https://www.ncbi.nlm.nih.gov/gene/) | 核实部分靶点身份、规范符号与 ID | 没有核对的外部 ID 留空；未假定完成全库同源映射 |
| [Cell 2023 框架](https://pubmed.ncbi.nlm.nih.gov/36599349/) | 12 类初始导航 | 综述不替代核心原始功能研究 |
| [GenAge / HAGR](https://genomics.senescence.info/help.html) / [CellAge](https://genomics.senescence.info/cells/index.html) | 查阅候选/数据库使用边界的入口 | 本批未批量导入，不把表达特征集当功能核心 |
| [Reactome R-HSA-165718](https://reactome.org/content/detail/R-HSA-165718) | 人类 mTORC1 对 S6K1 的背景反应、复合物粒度 | 不能当成某皮肤衰老模型已验证因果关系 |
| [Reactome 推断说明](https://reactome.org/documentation/inferred-events) / [许可](https://reactome.org/license) | 区分人类人工整理事件与同源推断、检查复用规则 | 本版不搬运整张数据库图或批量通路内容 |

近期线索实际包括 PMID 42765942、41690118 等2026综述，以及 CGAS 2026 原始研究 PMID 42642519。综述只用于补充线索，不作核心验证。未完成最新文献的系统性穷尽检索。

## 实际访问限制

- 部分奠基性文献只读取摘要；不要由其全文存在或有 PMCID 推定已读完整原文。
- MAPK14 2011 核心亚型 shRNA 依据来自可检索的原始全文片段，直接页面遭验证码；该范围已在 evidence 中记录。HCA2 组织来源未从本次片段实核，不推称为所有实验都是皮肤特异。
- S6K1 2009 文献有2011更正关联；更正原文出版商访问受限，本版只提取已读小鼠部分，不纳入非哺乳动物机制结论。
- BECN1 2018 的 [Author Correction PMID 29921925](https://pubmed.ncbi.nlm.nih.gov/29921925/)涉及 Fig.2c 误粘贴；更正说明原始 Source Data 正确，在线图已修正。原始结果和更正状态一起展示。
- OpenAlex/Unpaywall 查询结果按实际响应记录。Unpaywall 缺少联系邮箱导致请求失败，未使用伪造邮箱；失败不代表论文没有合法开放版本。
- 更正/撤稿关联字段未见标记只能称“本次可得字段未见”；不等于全面 Crossmark 或逐出版商审计。

## 保存与再利用

网站保存原创中文概述、必要事实、完整文献题名和链接，不提供论文全文/图片转载。本地核验产生的长 API 响应和全文放在 `research/raw/` 并忽略提交；发布包仅含公共结构化数据和应用资源。短原文片段不超过必要核验长度。

原论文、HGNC、NCBI、Reactome、HAGR及各依赖库保留各自权利和条款。后续若需要批量下载、复制图片或大规模导入，应重新核对相应版本许可；本版无此操作。

## 1.1.0 ECM 补充检索

新增原始研究核验中间数据位于 `research/ecm-ccn1-research.json`、`ecm-col17-research.json`、`ecm-mmp1-research.json`，实际检索式与获取范围同步进入正式 `search-log.json`。主题说明在 `ecm-mechanism.json`，不将 ECM 并入 Cell 2023 原始标志。

- CCN1：PMID22566095 的复制衰老真皮成纤维细胞研究目前仅核对摘要；PMID20526329 读取合法开放正文，另核对 Fig.2a 组标签交换的勘误 DOI10.1038/ncb1210-1249。分别解释胶原稳态与创面抗纤维化。
- COL17A1：PMID30944469 按公开摘要和可公开读取的扩展图注提取，未声称阅读需订阅的主体正文。自然老龄小鼠、HaCaT三维模型、人组织年龄关联与年轻鼠创面化合物处理分别记录。
- MMP1：PMID36914001 的人 MMP1 转基因小鼠研究；物种保持为小鼠，实际干预实体为人转基因，不改写为人体干预。早期2015文献无摘要时不只凭题名补结论。

目前没有补出未经核对的 FAK/整合素因果链，也未将 CCN1 所致 MMP1 读出变化直接升级为一条已验证的靶点间完整调控链。
