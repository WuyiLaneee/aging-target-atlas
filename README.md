# 抗衰靶点与通路图谱

Aging Target and Pathway Atlas：按原始功能研究查阅哺乳动物衰老靶点、实验模型、表型与条件依赖关系。静态网站，无需登录、数据库或运行时 AI 接口。

当前数据版本 **1.3.0，整理日期 2026-11-09**。按 Cell 2023 的 12 类衰老标志和细胞外基质（ECM）组织内容，已收录 33 个核心靶点、26 个通路与研究主题、55 篇原始研究。详见 [覆盖清单](docs/DATA_COVERAGE.md)。

## 本地启动（Windows 初学者）

先安装 Node.js **24 LTS**，在本项目文件夹空白处右键打开终端，依次输入：

```powershell
npm ci
npm run dev
```

在浏览器打开终端显示的地址，通常为 `http://127.0.0.1:5173/`。关闭终端会停止服务。不能直接双击 `index.html`：数据需要通过 HTTP 加载。

构建与预览：

```powershell
npm run validate:data
npm test
npm run build
npm run preview
```

`dist/` 是可发布的静态产物；`npm run build` 同时执行数据检查与 TypeScript 检查。安装依赖以 `package-lock.json` 为准。运行前不需要配置密钥。

## 怎么查阅

- 首页统一搜索靶点名称、基因符号、通路、论文题名、作者、PMID 或 DOI。结果分为靶点、通路和论文；输入精确基因符号时对应靶点优先。可从侧栏打开文献索引与覆盖清单。
- 总览保留 12 类衰老标志导航，另设 ECM 扩展入口。ECM 下可查胶原周转、基底膜黏附、细胞与基质相互作用及对应研究。
- 靶点目录支持按机制、物种、模型等条件筛选。靶点首屏展示代表研究的模型、结果和文献；论文可打开 PubMed、DOI 和已收录的开放全文。
- [通路图册](https://wuyilaneee.github.io/aging-target-atlas/#/pathways)支持按衰老机制筛选。每个通路页先显示从左向右的机制图，标准反应、实验分支和观察关联分别呈现。点击靶点查看档案，点击连线查看反应、实验条件和论文。可用图下方列表逐条阅读，也可复制当前分支的地址。
- 交互图谱默认一层、最多 40 条边；可拖动、缩放、复位、定位、展开第二层及切换背景。桌面分筛选、图谱和详情三栏；窄屏改为上下排列，并提供可读关系列表。
- 点击连线看原始实验条件；“机制背景”与“衰老功能实验”分开。无箭头的遗传依赖不能理解成直接分子抑制或激活。
- 补充的人组织观察关联、非衰老模型和年轻动物创面用药结果单独标记，不自动生成衰老功能连线；COL17A1 不与泛指的可溶胶原或真皮 I 型胶原混同。
- 目录或详情可加入 2–4 个靶点对比。共享通路不等于已核实直接连接；本版跨靶点关系仍为保守样例集。

## 收藏、笔记与导出

收藏靶点、通路或文献；靶点和通路详情可写笔记，文献笔记在收藏页编辑。记录存在当前浏览器的 `aging-target-pathway-atlas:personal:v1`，不会自动上传或跨设备同步。更换浏览器或清理存储前，请导出个人 JSON 备份。

导入先验证并预览；默认收藏取并集，同 ID 笔记保留当前记录，不覆盖。已从站点移除的旧 ID 仍显示并保留笔记。删除笔记需要确认。

目录导出当前筛选范围 CSV/JSON；详情、对比导出所选条目；通路目录导出通路表；图谱导出当前关系 CSV。JSON 保留证据、关系条件、端点实体与来源。公共导出不会带私人笔记。CSV 使用 UTF-8 BOM、引号/换行转义和公式前缀防护；参考文献支持 RIS 和完整引文复制。

PNG 导出为真实位图，把图谱、中文标签、箭头、图例、筛选条件、版本、日期及来源列表合成到同一张高分辨率图片。节点和图例大小不表示抗衰效力。首版未承诺 SVG 导出。

## GitHub Pages 发布

1. 将代码推送到 GitHub 仓库 `main` 分支。
2. 进入 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 在 **Actions** 查看 `Validate, build and deploy atlas`。完成数据检查、测试、构建、上传、部署后，`github-pages` 环境给出访问地址。
4. 等待 GitHub Pages 部署成功；构建通过与上线成功是不同状态。

工作流使用核对过的官方 Actions 主版本：checkout v7、setup-node v7、upload-pages-artifact v5、deploy-pages v5；Node 24。构建任务只读代码，部署任务仅授予 Pages 和 OIDC 所需权限，不需要在前端或仓库保存私钥。

项目站 `https://用户名.github.io/仓库名/` 自动从 `GITHUB_REPOSITORY` 推导 Vite `base=/仓库名/`。账号根站仓库 `用户名.github.io` 使用 `/`；自定义域名或特殊路径可显式设置 `VITE_BASE_PATH`。HashRouter 使详情直达、刷新和前进后退不依赖服务器重写。

模拟项目子路径：

```powershell
$env:VITE_BASE_PATH='/aging-target-atlas/'
npm run build
npm run preview -- --port 4173
# 打开 http://127.0.0.1:4173/aging-target-atlas/#/targets/target-crat
Remove-Item Env:VITE_BASE_PATH
```

## 文件结构与数据更新

```text
src/config.ts                 网站名称与浏览器存储命名空间
src/schema.ts                 运行时 Zod schema 与 TypeScript 类型
src/data.ts                   base 安全的数据加载与检索层
src/App.tsx                   总览、目录、详情、对比、个人记录、说明
src/ResearchViews.tsx         全站检索、覆盖清单与通路证据
src/PathwayDiagram.tsx        可点击的通路图和来源面板
src/Graph.tsx                 Cytoscape 局部图、连线详情及 PNG
src/lib/                      公共导出、CSV、防护与备份逻辑
research/*-research.json      已提取的研究中间数据与检索记录
research/*-relations.json     经原文核验的跨靶点关系
research/pathway-curation.json 研究主题映射（非完整通路数据库）
research/pathway-evidence-map.json  既有证据与通路的逐条映射
research/coverage-*.json      覆盖清单与新增原始研究批次
research/maps-*               通路图分支、节点和逐箭头出处
public/data/                  正式发布的独立结构化数据与 JSON Schema
scripts/assemble-data.mjs     明确执行时才重新组装数据
scripts/validate-data.mjs     引用、实体、统计与语义约束校验
scripts/browser-smoke.js      在独立浏览器配置下运行的交互验收脚本
scripts/research-smoke.js     全站搜索、清单和逐条通路证据的浏览器验收
scripts/pathway-diagram-smoke.js  通路图册与分支交互验收
tests/                        必要完整性、导出与备份测试
docs/                         科研规则、来源、覆盖、核验与验收记录
.github/workflows/pages.yml   GitHub Pages 自动检查与发布
```

后续按需更新：检索 → 核对原文、身份和更正 → 合并稳定 ID → 记录版本变更 → 数据校验与验收 → 发布。不要自动定时检索。

`public/data/atlas.json` 为页面唯一公共数据源；拆分 JSON 供审阅和下载。组装仅在明确执行 `npm run data:assemble` 时发生，构建不会静默重建或覆盖人工修订。若直接改了正式 JSON，先把修订合并回 `research/` 的对应记录，并检查差异后再组装；保留已有 ID，新增表型由名称哈希生成，重命名时应维护迁移关系。版本在组装脚本中修改并同步 CHANGELOG。

不要提交 `research/raw/` 的临时全文/API长响应、`output/` 的本地验收下载、个人备份或密钥。网站仅发布 `dist/` 内资源，论文图片和全文不在发布包。

## 验证

`npm test` 检查 CSV 注入防护、Unicode 归一化、备份拒绝/合并、局部图规模，以及错误端点、伪造结合和缺少原始依据时的拒绝行为。结构校验不能替代科学核验，详见 `docs/SCIENTIFIC_AUDIT.md`。

浏览器冒烟脚本用于独立测试浏览器，会清空该测试配置中**本项目的个人记录键**并写入测试笔记。不要在自己的日常使用配置中运行。已通过的实际环境、路径和下载检查记录在 `docs/VALIDATION.md`。CLI 调用示例（先打开独立浏览器）：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=atlas-qa open http://127.0.0.1:5173/ --browser msedge
npx --yes --package @playwright/cli playwright-cli -s=atlas-qa run-code --filename scripts/browser-smoke.js
```

代码依赖采用各自许可证；研究事实与中文整理见 [数据来源](docs/DATA_SOURCES.md)，本项目不宣称拥有原论文、数据库或依赖库的权利。
