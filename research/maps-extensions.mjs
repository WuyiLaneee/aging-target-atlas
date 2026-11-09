import { cite, reactome, target, gene, node, result, input, step, chain, map, track, edge } from "./maps-homeostasis.mjs";

const nrf = gene("NFE2L2", "核因子 NRF2 · 氧化与亲电子应激下的转录因子", 4780, "NRF2 与小 Maf 蛋白协同识别抗氧化反应元件。", "NFE2L2（NRF2）");
const keap = gene("KEAP1", "Kelch 样 ECH 相关蛋白 1", 9817, "在静息条件下，KEAP1 作为 CUL3 泛素连接酶的底物适配蛋白，促进 NRF2 周转。");
const nrfRegulation = reactome("R-HSA-9755511", "KEAP1–NFE2L2 通路");
const nrfTranscription = reactome("R-HSA-9818027", "NFE2L2 调节抗氧化和解毒酶表达");
const tgf = reactome("R-HSA-2173789", "TGF-β 受体激活 SMAD");
const smad4 = gene("SMAD4", "SMAD 家族成员 4 · 共介导 SMAD", 4089, "与磷酸化 SMAD2/3 形成转录调节复合物。");
const tgfStudy = "study-smad4-hs68-galangin";
const wnt = reactome("R-HSA-201681", "经典 WNT 的 TCF 依赖性信号");
const ctnnb1 = gene("CTNNB1", "β-连环蛋白 · 转录共激活因子与黏附连接组分", 1499, "膜上的 β-catenin 参与黏附连接；进入细胞核的 β-catenin 可与 TCF/LEF 协同调节转录。", "CTNNB1（β-catenin）");
const cdh1 = gene("CDH1", "E-钙黏蛋白 · 上皮黏附连接组分", 999, "细胞外结构域可与 Amuc_1409 结合。", "CDH1（E-cadherin）");
const amuc7 = cite("Kang 等，Fig. 7 · Amuc_1409 结合及 β-catenin 亚细胞定位", "https://pmc.ncbi.nlm.nih.gov/articles/PMC10998920/#Fig7");
const amuc8 = "study-amuc1409-cdh1-organoid";
const ampk = gene("PRKAA1","AMPK 催化 α1 亚基",5562,"AMPK 是由 α、β、γ 亚基组成的异源三聚体；PRKAA1 编码其中一种催化 α 亚基。","AMPK 复合物");
const ampkSignal = reactome("R-HSA-380972", "LKB1–AMPK 对 mTOR 的能量依赖调节");
const yap = gene("YAP1","Yes1 相关转录调节因子",10413,"细胞核内可作为转录共激活因子。","YAP1");
const taz = gene("WWTR1","WW 结构域转录调节因子 1",25937,"Hippo 通路中的 TAZ 对应 WWTR1。","WWTR1（TAZ）");
const ccn2 = gene("CCN2","细胞通讯网络因子 2（CTGF）",1490,"参与细胞与基质相互作用。","CCN2（CTGF）");
const hippo = reactome("R-HSA-2028269", "Hippo 信号");
const yapStudy = "study-yap-ccn2-hdf";

export const extensionMaps = [
  map("nrf2",
    chain("keap1-basal", "静息时 NRF2 周转", "standard", "静息状态下的 KEAP1–CUL3 底物识别及蛋白酶体降解。", [keap, {...nrf,label:"NRF2 蛋白积累"}], [
      step("inhibition", "促进降解", "KEAP1 结合 NRF2 并帮助 CUL3 复合物对其进行泛素化，随后由蛋白酶体降解。", nrfRegulation),
    ]),
    chain("nrf2-are", "氧化应激下的转录应答", "standard", "细胞受氧化或亲电子应激时，KEAP1 介导的 NRF2 周转减慢。", [input("stress","氧化 / 亲电子应激"), {...nrf,label:"NRF2 稳定并入核"}, node("are","ARE 调控的转录")], [
      step("process", "解除持续降解", "KEAP1 的氧化或亲电子修饰使 NRF2 的泛素化减少，稳定的 NRF2 在核内累积。", nrfRegulation),
      step("activation", "促进转录", "NRF2 与小 Maf 蛋白结合抗氧化反应元件（ARE），上调 NQO1 等基因的转录。", nrfTranscription),
    ]),
    chain("sirt1-hs68", "真皮细胞中的 SIRT1 依赖应答", "experiment", "人 HS68 真皮成纤维细胞受 H₂O₂ 处理，比较高良姜素干预及 SIRT1 siRNA。", [target("sirt1","SIRT1 siRNA"), {...nrf,label:"NRF2 相关应答减弱"}], [
      step("process", "敲低后", "敲低 SIRT1 后，高良姜素引起的 NRF2 相关应答减弱，SA-β-gal 阳性比例的改善也被削弱。", "ev-sirt1-dependency"),
    ]),
  ),
  map("tgfb-smad",
    chain("tgf-receptor", "受体磷酸化至 SMAD 入核", "standard", "Reactome 人类 TGF-β 受体通路：配体结合受体复合物后的磷酸化顺序。", [
      gene("TGFB1","转化生长因子 β1",7040,"活化的 TGFB1 二聚体结合 TGFBR2。","TGF-β1"),
      gene("TGFBR2","TGF-β II 型受体",7048), gene("TGFBR1","TGF-β I 型受体（ALK5）",7046),
      gene("SMAD2","SMAD 家族成员 2",4087,"受体也可磷酸化平行效应蛋白 SMAD3。","SMAD2 磷酸化"),
      {...smad4,label:"SMAD4 复合物入核"},
    ], [
      step("process", "结合受体", "活化的 TGF-β1 与 TGFBR2 结合，并募集 TGFBR1。", tgf),
      step("activation", "磷酸化并激活", "TGFBR2 磷酸化 TGFBR1 的 GS 区，激活 TGFBR1。", tgf),
      step("activation", "磷酸化", "TGFBR1 磷酸化 SMAD2 或 SMAD3 的 C 端丝氨酸。", tgf),
      step("process", "组装并入核", "磷酸化的 SMAD2/3 与 SMAD4 形成复合物并进入细胞核。", tgf),
    ]),
    chain("smad4-collagen", "H₂O₂ 模型中的 SMAD4 与胶原", "experiment", "人 HS68 真皮成纤维细胞。高良姜素处理后，使用 miRNA 模拟物和 SMAD4 siRNA 检验胶原蛋白读出的依赖性。", [
      input("galangin", "高良姜素处理"), node("mir4535", "hsa-miR-4535 表达"), smad4, result("collagen", "COL1A1 / COL3A1 蛋白"),
    ], [
      step("inhibition", "降低表达", "HS68 细胞先用 200 μM H₂O₂ 处理 1 h，再用 30 μM 高良姜素处理 23 h。miR-4535 表达低于 H₂O₂ 处理组。", tgfStudy),
      step("inhibition", "抑制报告信号", "转染 miR-4535 模拟物后，野生型 SMAD4 3′-UTR 报告信号低于突变型报告。", tgfStudy),
      step("process", "胶原读出依赖", "敲低 SMAD4 会削弱高良姜素处理后 COL1A1、COL3A1 蛋白水平的升高。", tgfStudy),
    ]),
  ),
  map("wnt",
    chain("wnt-canonical", "受体至 β-catenin 转录", "standard", "经典 WNT：配体与 Frizzled 及 LRP5/6 共受体结合后的转录应答。", [
      input("wnt","WNT 配体"), node("receptor","Frizzled–LRP5/6"), ctnnb1, result("tcf","TCF / LEF 依赖转录"),
    ], [
      step("activation", "结合并启动", "WNT 配体与 Frizzled 及 LRP5/6 形成受体复合物。", wnt),
      step("process", "稳定并促进核积累", "受体信号减弱降解复合物对 β-catenin 的周转作用，使 β-catenin 稳定并进入细胞核。", wnt),
      step("activation", "促进转录", "核内 β-catenin 与 TCF/LEF 协同调节 WNT 响应基因的转录。", wnt),
    ]),
    chain("amuc-cell-lines", "菌源蛋白与 E-cadherin", "experiment", "人 HT-29 与 HEK293T 细胞的结合和定位实验。", [input("amuc", "重组 Amuc_1409"), cdh1, {...ctnnb1,label:"β-catenin 核定位"}], [
      step("process", "结合胞外域", "拉下实验显示重组 Amuc_1409 与 E-cadherin 胞外结构域和全长蛋白结合。", amuc7),
      step("process", "处理后核积累", "HT-29 细胞处理后，E-cadherin 与 β-catenin 的膜组分下降，β-catenin 核定位增加。", amuc7),
    ]),
    chain("amuc-organoids", "肠类器官的 CDH1 依赖性", "experiment", "小鼠肠类器官中诱导 Lgr5⁺ 干细胞的 Cdh1 缺失，再比较重组 Amuc_1409 与对照。", [input("amuc", "重组 Amuc_1409"), {...cdh1,label:"肠干细胞 CDH1"}, result("growth", "类器官生长及 WNT 读出")], [
      step("process", "遗传依赖", "在 Cdh1 缺失的类器官中，Amuc_1409 的促生长效应消失。", amuc8),
      step("process", "CDH1 缺失后", "肠干细胞特异性 Cdh1 缺失使 Amuc_1409 诱导的 WNT 靶基因读出和类器官分叶改善消失。", amuc8),
    ]),
  ),
  map("ampk",
    chain("ampk-tsc2", "能量不足时的 mTORC1 调控", "standard", "能量负荷下降时，LKB1–AMPK 轴通过 TSC 复合物调节 mTORC1。", [
      input("energy", "细胞能量负荷下降"), ampk, gene("TSC2","TSC 复合物亚基 2",7249,"TSC 复合物促使 RHEB 水解 GTP。"), target("mtor","mTORC1 活性"),
    ], [
      step("activation", "激活 AMPK", "能量负荷下降时，AMPK 通过 LKB1 介导的磷酸化等机制活化。", ampkSignal),
      step("activation", "磷酸化 TSC2", "AMPK 磷酸化 TSC2，促进 TSC 对 RHEB 的 GTP 酶激活作用。", reactome("R-HSA-380927", "p-AMPK 磷酸化 TSC1:TSC2")),
      step("inhibition", "经 RHEB 降低活性", "TSC 促进 RHEB 由 GTP 结合态转为 GDP 结合态，使 mTORC1 活性下降。", ampkSignal),
    ]),
    chain("ampk-ulk1", "AMPK 与自噬起始", "standard", "能量应激条件下，AMPK 通过磷酸化参与 ULK 复合物的调节。", [ampk, gene("ULK1","自噬起始激酶 ULK1",8408)], [
      step("process", "磷酸化 ULK1", "活化的 AMPK 磷酸化 ULK1。磷酸化位点和调节结果取决于营养与应激条件。", reactome("R-HSA-5665868", "AMPK 复合物磷酸化 ULK1 复合物")),
    ]),
  ),
  map("hippo-yap",
    track("lats-yap-taz", "LATS 磷酸化 YAP / TAZ", "standard", "人类 Hippo 通路中的两种转录共调节蛋白及其定位。", [
      {...gene("LATS1","LATS 大肿瘤抑制激酶 1",9113),col:0,row:0}, {...yap,col:1,row:0}, {...taz,col:1,row:1}, {...result("nuclear","核内活性降低"),col:2,row:0},
    ], [
      edge("lats1","yap1","process","磷酸化","LATS1/2 磷酸化 YAP1；磷酸化后可结合 14-3-3，限制其在核内的活性。",hippo),
      edge("lats1","wwtr1","process","磷酸化","LATS1/2 同样可磷酸化 WWTR1（TAZ）。",hippo),
      edge("yap1","nuclear","process","磷酸化后","被 LATS 磷酸化的 YAP1 可与 14-3-3 结合并滞留于胞质。",hippo),
      edge("wwtr1","nuclear","process","磷酸化后","LATS 介导的 WWTR1 磷酸化可限制核定位。",hippo),
    ]),
    chain("yap-ccn2-hdf", "细胞铺展与真皮 CCN2", "experiment", "人真皮成纤维细胞中改变细胞铺展和大小，结合 YAP/TAZ 的增益及缺失实验。", [
      input("spreading","限制细胞铺展"), {...yap,label:"YAP1 / TAZ 活性",note:"论文联合分析 YAP1 与 TAZ（WWTR1）。此节点链接 YAP1 基因档案。"}, ccn2,
    ], [
      step("inhibition", "降低活性", "铺展和细胞大小减少时，核内 YAP/TAZ 活性下降。", yapStudy),
      step("activation", "支持表达", "恢复细胞大小可恢复 CCN2 表达，且该恢复依赖 YAP/TAZ。", yapStudy),
    ]),
  ),
];

export const diagramExpansion = {
  publications: [{
    id:"pub-34890367", title:"Protective effects of galangin against H2O2/UVB-induced dermal fibroblast collagen degradation via hsa-microRNA-4535-mediated TGFβ/Smad signaling.",
    authors:["Lee JJ","Ng SC","Ni YT","Liu JS","Chen CJ","Padma VV","Huang CY","Kuo WW"], year:2021, journal:"Aging", doi:"10.18632/aging.203750", pmid:"34890367",
    url:"https://pubmed.ncbi.nlm.nih.gov/34890367/", fullTextUrl:"https://pmc.ncbi.nlm.nih.gov/articles/PMC8714160/",
    accessScope:"开放全文，Figs. 5–8 与 Methods。", metadataVerified:true, claimVerified:true,
    correctionStatus:"PubMed 书目及期刊正文。",
  },{
    id:"pub-35480397", title:"Age-Related Downregulation of CCN2 Is Regulated by Cell Size in a YAP/TAZ-Dependent Manner in Human Dermal Fibroblasts: Impact on Dermal Aging.",
    authors:["Qin Z","He T","Guo C","Quan T"], year:2022, journal:"JID Innovations", doi:"10.1016/j.xjidi.2022.100111", pmid:"35480397",
    url:"https://pubmed.ncbi.nlm.nih.gov/35480397/", fullTextUrl:"https://pmc.ncbi.nlm.nih.gov/articles/PMC9035808/",
    accessScope:"PubMed 摘要：细胞大小、YAP/TAZ 操作和 CCN2 表达结果。", metadataVerified:true, claimVerified:true, correctionStatus:"PubMed / Europe PMC 书目。",
  }],
  pathways: [
    {id:"pathway-nrf2",name:"KEAP1–NRF2 抗氧化应答",summary:"静息状态下的 NRF2 周转、氧化应激后的转录应答，以及人真皮成纤维细胞的相关实验。",hallmarks:[4,7],referenceId:"R-HSA-9755511"},
    {id:"pathway-tgfb-smad",name:"TGF-β–SMAD 信号与胶原",summary:"TGF-β 受体激活 SMAD 的反应顺序及人真皮成纤维细胞的胶原读出。",hallmarks:[10],mechanismIds:["mechanism-ecm"],referenceId:"R-HSA-170834"},
    {id:"pathway-wnt",name:"WNT–β-catenin 信号与肠干细胞",summary:"经典 WNT 的 β-catenin 转录应答，以及菌源蛋白在肠道细胞和类器官中的研究。",hallmarks:[9,10,12],referenceId:"R-HSA-201681"},
    {id:"pathway-ampk",name:"AMPK 能量感知",summary:"低能量负荷时 AMPK 对 TSC–mTORC1 与 ULK1 的两条调节分支。",hallmarks:[5,6],referenceId:"R-HSA-380972"},
    {id:"pathway-hippo-yap",name:"Hippo–YAP/TAZ 与真皮力学应答",summary:"LATS 对 YAP/TAZ 的磷酸化，以及真皮成纤维细胞铺展、YAP/TAZ 与 CCN2 表达。",hallmarks:[8,10],mechanismIds:["mechanism-ecm"],referenceId:"R-HSA-2028269"},
  ],
  themeStudies: [
    {id:tgfStudy,pathwayId:"pathway-tgfb-smad",publicationId:"pub-34890367",subject:"高良姜素、miR-4535 与 SMAD4",claim:"在 H₂O₂ 处理的 HS68 细胞中，SMAD4 敲低削弱高良姜素引起的胶原蛋白升高。",species:["Homo sapiens"],model:"H₂O₂ 处理的人 HS68 真皮成纤维细胞",intervention:"200 μM H₂O₂ 处理 1 h 后用 30 μM 高良姜素处理 23 h；平行实验加入 miR-4535 模拟物或 SMAD4 siRNA，并进行 SMAD4 3′-UTR 报告实验。",result:"高良姜素降低 miR-4535，SMAD4 和 COL1A1、COL3A1 蛋白读出升高。SMAD4 敲低或 miR-4535 模拟物削弱胶原蛋白升高；野生型 SMAD4 3′-UTR 报告信号低于突变型。",locator:"Figs. 5C、6C–D、7、8A–E",evidenceType:"报告基因与 siRNA",studyContext:"aging_function"},
    {id:amuc8,pathwayId:"pathway-wnt",publicationId:"pub-38582860",subject:"肠干细胞特异性 Cdh1 缺失",claim:"肠干细胞特异性 Cdh1 缺失后，Amuc_1409 对肠类器官生长及 WNT 靶基因的作用减弱。",species:["Mus musculus"],model:"Lgr5-CreERT2;Cdh1 flox/flox 小鼠的肠隐窝类器官",intervention:"1 μM 4-羟基他莫昔芬诱导 Cdh1 缺失，与载体比较；用 16 nM 重组 Amuc_1409 处理类器官。",result:"Cdh1 缺失类器官中，Amuc_1409 的促分叶及靶基因表达效应消失。",locator:"Fig. 8a–h，Supplementary Fig. 6",evidenceType:"诱导性缺失及类器官读出",studyContext:"nonaging_support"},
    {id:yapStudy,pathwayId:"pathway-hippo-yap",publicationId:"pub-35480397",subject:"人真皮成纤维细胞的铺展与 YAP/TAZ",claim:"人真皮成纤维细胞的 CCN2 表达随细胞铺展和大小改变，依赖 YAP/TAZ。",species:["Homo sapiens"],model:"人真皮成纤维细胞的铺展和大小干预",intervention:"改变细胞铺展与大小，进行 YAP/TAZ 增益及缺失比较。",result:"细胞铺展和大小减少时 CCN2 表达降低；恢复大小后 CCN2 表达恢复，且依赖 YAP/TAZ。",locator:"PubMed 摘要：mechanistic investigation、gain-of-function / loss-of-function 段落。",evidenceType:"细胞形态干预与功能增益/缺失",studyContext:"aging_function"},
  ],
};
