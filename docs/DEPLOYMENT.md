# GitHub Pages 发布与线上复核

- [正式网站](https://wuyilaneee.github.io/aging-target-atlas/)
- [公开源码](https://github.com/WuyiLaneee/aging-target-atlas)
- 发布分支：`main`；Pages 来源：`workflow`；HTTPS 已启用。

## 1.2.0 正式网址复核（2026-11-09）

- 应用与数据提交：`3d34e04db5bda51efec0c3171ad9f38cc419d945`。[GitHub Actions 42562930504](https://github.com/WuyiLaneee/aging-target-atlas/actions/runs/42562930504) 的构建与部署任务均通过。
- 正式站点返回版本 1.2.0，包含 33 个核心靶点、21 个通路与研究主题、53 篇原始研究及 70 条证据。线上 `atlas.json` 的 SHA-256 与本地生产构建一致。
- 正式 HTTPS 地址通过 `scripts/research-smoke.js` 的 19 项检查，包括靶点、通路和论文检索、原文链接、实验定位、覆盖清单与 390px 布局。

## 1.1.0 ECM 正式网址复核

[GitHub Actions 39231200884](https://github.com/WuyiLaneee/aging-target-atlas/actions/runs/39231200884) 发布提交 `e9e7f07bd5da6a01248604546c51c31fcb5ac7cd`。

[ECM 机制专页](https://wuyilaneee.github.io/aging-target-atlas/#/mechanisms/mechanism-ecm)已上线。正式域名的数据HTTP200，版本1.1.0、24靶点、41证据、12个原始标志和1个扩展机制均与本地一致。

在独立Edge测试配置运行 `scripts/ecm-smoke.js`，13项断言全部通过：原12类导航、独立扩展说明、3个新增靶点、ECM目录5条筛选与搜索、补充证据分层、既有收藏笔记保留、图谱背景关系、窄屏和未捕获错误。JSON及PNG已从正式网址实际下载；测试日志和截图保存在本地忽略目录 `output/playwright/`。

## 1.0.0 正式网址复核历史

在 Windows Microsoft Edge 独立测试配置中，对正式 HTTPS 域名完成30项浏览器操作/断言：分类、空状态、查询、组合筛选、对比上限、收藏/笔记、备份验证/合并、旧ID保留、图谱关系定位与展开、下载、窄屏和故障状态。没有未捕获的应用错误；故意模拟503的网络日志是预期测试结果。

正式域名实际下载 CSV、JSON、RIS、PNG 与个人备份；JSON已解析并检查关系证据引用、私人笔记隔离；CSV含UTF-8 BOM及中文；PNG可打开，CRAT 1800×1919、含背景的ATM二层图4395×4970，中文、图例、版本、筛选、来源和有向磷酸化连线已目视检查。私人测试笔记只在隔离测试浏览器与本地忽略目录，不在网站数据或仓库。

已对最新站点数据请求返回HTTP200，核对 CRAT 收录范围修订与本地一致；靶点独立链接直达、刷新、前进/后退可用。Chrome另做独立详情载入复核。1440×1000与390×844界面已检查。

本次交付同时保留本地完整代码、中文README、科研规则、来源记录、覆盖统计和验收文档。源码归档及项目子路径生产构建归档放在本地 `output/`，不重复提交到仓库。文档及验收脚本收尾提交不改变已部署应用或科研数据。

## 后续更新

按 README 更新研究、稳定 ID 和版本，提交到 `main`。工作流执行数据校验、测试、生产构建和 Pages 部署。网站可直接浏览，收藏与笔记存储在当前浏览器，可导出备份。

覆盖缺口与证据限制见 [DATA_COVERAGE](DATA_COVERAGE.md)；本版未经独立领域专家审核，不把结构/交互检查等同科学结论证明。
