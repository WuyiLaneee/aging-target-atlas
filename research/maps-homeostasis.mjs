export const cite = (title, url) => ({ title, url });
export const reactome = (id, title) => cite(`Reactome ${id} · ${title}`, `https://reactome.org/content/detail/${id}`);
export const target = (id, label, note) => ({ id, label, kind: "target", targetId: `target-${id}`, note });
export const gene = (symbol, name, ncbiId, note, label = symbol) => ({ id: symbol.toLowerCase(), label, kind: "target", note, gene: { symbol, name, url: `https://www.ncbi.nlm.nih.gov/gene/${ncbiId}` } });
export const node = (id, label, kind = "process", note) => ({ id, label, kind, note });
export const result = (id, label, note) => node(id, label, "outcome", note);
export const input = (id, label, note) => node(id, label, "input", note);
export const edge = (from, to, kind, label, detail, ...refs) => ({ from, to, kind, label, detail, refs });
export const step = (kind, label, detail, ...refs) => ({ kind, label, detail, refs });
export const track = (id, title, scope, context, nodes, edges) => ({ id, title, scope, context, nodes, edges });
export const chain = (id, title, scope, context, nodes, links) => track(id, title, scope, context,
  nodes.map((n, col) => ({ ...n, col })), links.map((e, i) => ({ ...e, from: nodes[i].id, to: nodes[i + 1].id })));
export const map = (id, ...tracks) => ({ pathwayId: `pathway-${id}`, tracks });

const cd = "ev-CD38-27304511";
const cd5 = cite("Camacho-Pereira 等 · 小鼠肝线粒体 SIRT3 活性与 NAD⁺，Fig. 5B", "https://pmc.ncbi.nlm.nih.gov/articles/PMC4911708/#F5");
const crat = "ev-crat-hdf";
const sirt3loss = "ev-sirt3-1";
const sirt3gain = "ev-sirt3-2";
const hsf = "ev-hsf1-kruta-2021-aging";
const hsp = "ev-hsf1-kruta-2021-culture";
const pr = "ev-psmb5-hwang-2007-dermis";

export const homeostasisMaps = [
  map("nad",
    chain("cd38-sirt3", "CD38、NAD⁺ 与 SIRT3 活性", "experiment", "1 岁小鼠的肝线粒体实验：比较 Cd38 敲除和同窝野生型，并在酶活测定中补加饱和 NAD⁺。", [target("cd38", "CD38"), node("nad", "NAD⁺ 可用性", "process", "NAD⁺ 是 SIRT3 依赖的辅底物。"), target("sirt3", "SIRT3 酶活")], [
      step("inhibition", "消耗", "CD38 水解 NAD⁺；Cd38 敲除小鼠的 NAD⁺ 保持较高水平。", cd),
      step("activation", "支持酶活", "内源 NAD⁺ 条件下，Cd38 敲除组 SIRT3 活性约为野生型的 3.5 倍；加饱和 NAD⁺ 后两组酶活相近。", cd5, cd),
    ]),
    chain("atm-sirt6", "ATM 磷酸化 SIRT6", "experiment", "重组 GST-SIRT6 与免疫纯化 ATM 的体外激酶实验。", [target("atm", "ATM"), target("sirt6", "SIRT6 · Ser112")], [
      step("process", "磷酸化", "ATM 处理使 SIRT6 发生磷酸化；S112A 突变体在相同实验中未出现对应磷酸化。", "ev-atm-sirt6-mechanism"),
    ]),
  ),
  map("mito",
    track("crat-hdf", "CRAT 缺失与真皮细胞衰老", "experiment", "原代人真皮成纤维细胞中的 siRNA 实验。三项末端读出均与对照组比较。", [
      {...input("sirna", "CRAT siRNA"),col:0,row:1}, {...target("crat", "CRAT 表达"),col:1,row:1},
      {...result("mitochondria", "线粒体功能异常"),col:2,row:0}, {...result("senescence", "SA-β-gal 阳性增加"),col:2,row:1}, {...result("sasp", "SASP 表达增加"),col:2,row:2},
    ], [
      edge("sirna", "crat", "inhibition", "敲低", "用 siRNA 降低内源 CRAT。", crat),
      edge("crat", "mitochondria", "process", "敲低后", "CRAT 敲低细胞出现线粒体形态和功能异常。", crat),
      edge("crat", "senescence", "process", "敲低后", "CRAT 敲低后 SA-β-gal 阳性细胞增加、增殖降低。", crat),
      edge("crat", "sasp", "process", "敲低后", "CRAT 敲低后 SASP 增加；共敲低 cGAS、STING 或 p65 可降低部分读出。", crat),
    ]),
    chain("cd38-respiration", "CD38 缺失后的呼吸变化", "experiment", "2 岁同窝小鼠：在分离的肝线粒体中测定 ATP 合成耦联呼吸。", [target("cd38", "CD38 敲除"), result("respiration", "ATP 耦联呼吸升高")], [
      step("process", "单敲除后", "Cd38 单敲除组的耦联耗氧率升高；同时敲除 Sirt3 后，该升高消失。", cd),
    ]),
  ),
  map("hsc",
    chain("sirt3-reconstitution", "SIRT3 与老龄造血重建", "experiment", "老龄小鼠来源造血干细胞：SIRT3 慢病毒与对照病毒的竞争性移植比较。", [target("sirt3", "SIRT3 过表达"), result("repopulation", "供体造血重建提高")], [
      step("activation", "提高", "老龄供体细胞集落形成约增加 40%，竞争性移植功能性重建约增加 5 倍；年轻细胞未见同样改善。", sirt3gain),
    ]),
    chain("sirt3-aged-loss", "Sirt3 缺失的年龄差异", "experiment", "年轻与老龄小鼠的 Sirt3 敲除和同龄对照。", [target("sirt3", "Sirt3 缺失"), result("hsc-pool", "老龄 HSC 库缩小")], [
      step("process", "老龄组读出", "老龄敲除组的表面标记定义的 HSC/HSPC 数量约减少一半，供体重建能力下降；年轻稳态组未见同样缺陷。", sirt3loss),
    ]),
    chain("foxo3-aged-hsc", "FOXO3 与造血干细胞频率", "experiment", "老龄 Foxo3a 缺失小鼠与同窝对照比较。", [target("foxo3", "Foxo3a 缺失"), result("frequency", "造血干细胞频率降低")], [
      step("process", "缺失后", "老龄 Foxo3a 缺失组的造血干细胞频率低于同窝对照。", "ev-foxo3-aged-hsc"),
    ]),
    chain("tet2-competition", "TET2 缺失与克隆竞争", "experiment", "同龄野生型与 Tet2 敲除供体的造血干祖细胞按 9:1 混合后移植。", [target("tet2", "Tet2 缺失"), result("competitive", "供体细胞竞争优势")], [
      step("process", "移植后", "年轻和老龄混合组的 Tet2 缺失供体均有竞争优势，老龄组优势更明显。", "ev-tet2-37884767-aging-competition"),
    ]),
  ),
  map("microbiota-host",
    track("fmt-aged", "高龄供体粪菌移植", "experiment", "抗生素预处理后的年轻小鼠接受 24 月龄供体菌群。", [
      {...input("fmt", "高龄供体 FMT"),col:0,row:1}, {...result("barrier", "肠屏障通透性增加"),col:1,row:0},
      {...result("microglia", "脑内 Iba-1⁺ 细胞增多"),col:1,row:1}, {...result("retina", "视网膜炎症读出升高"),col:1,row:2},
    ], [
      edge("fmt", "barrier", "process", "移植后", "年轻受体的肠屏障通透性增加。", "study-microbiota-parker-fmt"),
      edge("fmt", "microglia", "process", "移植后", "皮质与胼胝体的 Iba-1 阳性小胶质细胞增多。", "study-microbiota-parker-fmt"),
      edge("fmt", "retina", "process", "移植后", "视网膜炎症读数上升，RPE65 减少。", "study-microbiota-parker-fmt"),
    ]),
    chain("fmt-young", "年轻供体粪菌移植", "experiment", "老龄小鼠接受年轻供体或同龄供体菌群。", [input("young-fmt", "年轻供体 FMT"), result("behavior", "新物体探索增加")], [
      step("process", "移植后", "相对同龄供体组，新物体探索活动增加；长期新物体识别及 Y 迷宫自发交替的组间差异未达显著。", "study-microbiota-boehme-fmt"),
    ]),
    chain("amuc-aged", "菌源蛋白与老龄肠隐窝", "experiment", "老龄小鼠灌胃重组 Amuc_1409 15 周，与溶媒对照比较。", [input("amuc", "重组 Amuc_1409"), result("crypt", "隐窝 OLFM4⁺ / Ki67⁺ 细胞增加")], [
      step("process", "灌胃后", "每个小肠隐窝中的 OLFM4 阳性和 Ki67 阳性细胞数增加；同文另在老龄类器官中观察到出芽率升高。", "study-microbiota-kang-amuc1409"),
    ]),
    chain("akk-aging", "阿克曼菌补充", "experiment", "老龄小鼠每日口服嗜黏蛋白阿克曼菌 1 个月，每次 2 × 10⁸ CFU。", [input("akk", "口服 A. muciniphila"), result("endpoints", "运动及白细胞功能读出变化")], [
      step("process", "补充后", "相较同龄对照，部分运动协调和平衡指标改善，腹腔白细胞吞噬功能升高；IL-2、IL-6 和 TNF-α 的基础释放降低。", "study-microbiota-diaz-akk"),
    ]),
  ),
  map("heat-shock-proteostasis",
    chain("hsf1-hse", "HSF1 与热休克元件", "standard", "人类热休克反应：HSF1 三聚体结合靶基因启动子或调控区的热休克元件。", [input("stress", "热休克等细胞应激"), target("hsf1", "HSF1 三聚体"), node("hse", "热休克元件 HSE")], [
      step("activation", "诱导三聚化", "蛋白毒性应激触发 HSF1 活化并形成三聚体。", reactome("R-HSA-3371511", "HSF1 激活")),
      step("process", "结合 DNA", "活化的 HSF1 三聚体与靶基因的 HSE 序列结合。", reactome("R-HSA-4793819", "HSF1 三聚体结合 HSE")),
    ]),
    chain("hsf1-aged", "HSF1 缺失与造血重建", "experiment", "年轻和中年 Hsf1 条件敲除小鼠的供体骨髓竞争性移植。", [target("hsf1", "Hsf1 条件敲除"), result("reconstitution", "中年供体重建下降")], [
      step("process", "移植后", "中年缺失组长期竞争性造血重建下降；年轻组初次及二次移植的重建相近。", hsf),
    ]),
    chain("hsf1-culture", "培养应激下的 HSF1 依赖性", "experiment", "2–3 月龄供体造血干细胞体外培养后移植，并行比较 Hsf1 缺失细胞。", [input("aag", "17-AAG 培养处理"), result("engraftment", "长期多谱系重建增加")], [
      step("process", "HSF1 依赖", "二次受体中 17-AAG 组 31/37 实现长期重建，对照组为 11/32；Hsf1 缺失细胞未出现该改善。", hsp),
    ]),
  ),
  map("proteasome",
    track("psmb5-dermis", "PSMB5 与人真皮细胞读出", "experiment", "老龄供体来源原代人真皮成纤维细胞：慢病毒 PSMB5 转导与空载体对照。", [
      {...target("psmb5", "PSMB5 过表达"),col:0,row:1}, {...result("proteasome", "蛋白酶体活性升高"),col:1,row:0},
      {...result("oxidized", "氧化及泛素化蛋白减少"),col:1,row:1}, {...result("gal", "SA-β-gal 阳性率降低"),col:1,row:2},
    ], [
      edge("psmb5", "proteasome", "activation", "提高", "PSMB5 转导提高胰凝乳蛋白酶样活性。", pr),
      edge("psmb5", "oxidized", "process", "转导后", "转导组氧化蛋白和泛素化蛋白水平降低。", pr),
      edge("psmb5", "gal", "process", "转导后", "阳性比例为 7±2%，空载体为 26±3%（均值±SEM）。", pr),
    ]),
    chain("psmb5-imr90", "PSMB5 与复制寿命", "experiment", "IMR90 人肺成纤维细胞，稳定表达蛋白酶体 β5 的克隆与对照比较。", [target("psmb5", "β5 稳定过表达"), result("doublings", "群体倍增次数增加")], [
      step("activation", "延长", "到达复制性衰老前，过表达克隆比对照平均多约 4–5 次群体倍增。", "ev-psmb5-chondrogianni-2005"),
    ]),
  ),
];
