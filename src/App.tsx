import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Dna,
  Download,
  FlaskConical,
  GitCompareArrows,
  Layers,
  LayoutDashboard,
  List,
  Menu,
  Microscope,
  Network,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target as TargetIcon,
  X,
  Grid2X2,
  Upload,
  FileText,
  ExternalLink,
  Fingerprint,
  Flame,
  Leaf,
  RefreshCw,
  Radio,
  Timer,
  Workflow,
  ScanLine,
} from "lucide-react";
import { config } from "./config";
import glossary from "./glossary.json";
import { useAtlas } from "./state";
import { entity, skinLabels, targetCorpus } from "./data";
import type { Target } from "./schema";
import { normalize, validateBackup, mergeBackup } from "./lib/core.mjs";
import {
  exportData,
  exportMeta,
  download,
  ris,
  exportPathways,
} from "./lib/exports";
import {
  TargetCard,
  TargetActions,
  Empty,
  Tag,
  EvidenceCard,
  PubCard,
} from "./components";
const Graph = lazy(() => import("./Graph"));
const icons = [
  Dna,
  Timer,
  Fingerprint,
  Layers,
  RefreshCw,
  Activity,
  Sparkles,
  Microscope,
  Leaf,
  Radio,
  Flame,
  Workflow,
];
const nav = [
  ["/", "研究总览", LayoutDashboard],
  ["/targets", "靶点目录", TargetIcon],
  ["/pathways", "通路目录", Workflow],
  ["/graph", "交互图谱", Network],
  ["/compare", "靶点对比", GitCompareArrows],
  ["/library", "收藏与笔记", Bookmark],
  ["/methods", "方法与数据", BookOpen],
] as const;
export default function App() {
  const { atlas: a, compare } = useAtlas();
  const loc = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const positions = useRef<Record<string, number>>({});
  const previous = useRef(loc.pathname + loc.search);
  useEffect(() => {
    const next = loc.pathname + loc.search;
    positions.current[previous.current] = window.scrollY;
    previous.current = next;
    requestAnimationFrame(() =>
      window.scrollTo(0, positions.current[next] || 0),
    );
    setMobile(false);
  }, [loc.pathname, loc.search]);
  const title =
    nav.find(([path]) =>
      path === "/" ? loc.pathname === "/" : loc.pathname.startsWith(path),
    )?.[1] || "科研图谱";
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
          document.getElementById("main")?.scrollIntoView();
        }}
      >
        跳到内容
      </a>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link className="brand" to="/">
          <span className="brand-symbol">
            <Network size={26} />
          </span>
          <span>
            {config.shortName}
            <small>衰老机制 · 证据图谱</small>
          </span>
        </Link>
        <div className="nav-caption">RESEARCH WORKSPACE</div>
        <nav>
          {nav.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon size={19} />
              <span>{label}</span>
              {path === "/compare" && compare.length > 0 && (
                <b className="count-badge">{compare.length}</b>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-scope">
          <span className="tiny-label">研究范围</span>
          <p>
            人类与其他哺乳动物
            <br />
            功能实验 · 条件依赖
          </p>
          <Tag tone="green">
            <span className="dot" />
            开放查阅 · 本地笔记
          </Tag>
        </div>
        <div className="sidebar-bottom">
          <div>
            <span className="dot" /> 数据版本 {a.manifest.version}
          </div>
          <small>最近整理 {a.manifest.updated}</small>
          <Link to="/methods">
            查看收录与证据边界 <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="关闭导航遮罩"
          className="scrim"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-btn"
              aria-label="展开导航"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </button>
            <span>研究工作台</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <form
            className="top-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/targets?q=${encodeURIComponent(search)}`);
            }}
          >
            <Search size={16} />
            <input
              aria-label="全站搜索"
              placeholder="搜索靶点、通路或文献…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <Link className="help-link" to="/methods" aria-label="使用与数据说明">
            <CircleHelp size={19} />
          </Link>
        </header>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<div className="empty">正在载入图谱模块…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/targets" element={<Directory />} />
              <Route path="/targets/:id" element={<TargetDetail />} />
              <Route path="/pathways" element={<Pathways />} />
              <Route path="/pathways/:id" element={<PathwayDetail />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/library" element={<Library />} />
              <Route path="/methods" element={<Methods />} />
              <Route
                path="*"
                element={
                  <Empty title="页面未找到">
                    <Link to="/">回到研究总览</Link>
                  </Empty>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <footer className="site-footer">
          <span>{config.englishName}</span>
          <span>基于研究证据，保留模型与结论边界。</span>
        </footer>
      </div>
      {compare.length > 0 && loc.pathname !== "/compare" && (
        <Link className="compare-float" to="/compare">
          <GitCompareArrows size={18} /> 已选 {compare.length} 个靶点{" "}
          <span>开始对比 →</span>
        </Link>
      )}
    </div>
  );
}
function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}
function Home() {
  const { atlas: a } = useAtlas();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const skin = a.targets.filter((t) => t.skinClassification === "skin_aging");
  const featured = ["CRAT", "SIRT6", "CGAS"]
    .map((s) => a.targets.find((t) => t.symbol === s))
    .filter(Boolean) as Target[];
  const covered = a.taxonomy.filter((h) =>
    a.targets.some((t) => t.taxonomyIds.includes(h.id)),
  ).length;
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="dot" /> EVIDENCE-BASED AGING RESEARCH
          </div>
          <h1>
            探索衰老机制，
            <br />
            <span>让每一次连接都有依据。</span>
          </h1>
          <p>
            {config.name} · 从分子靶点到实验表型，
            <br className="desktop-break" />
            在具体物种与模型中理解关系、发现研究线索。
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/targets">
              开始探索靶点 <ArrowRight size={17} />
            </Link>
            <Link className="subtle-btn" to="/graph">
              <Network size={17} />
              进入交互图谱
            </Link>
          </div>
          <div className="hero-meta">
            <ShieldCheck size={14} />
            原始功能研究 <span>·</span> 条件可追溯 <span>·</span> 无需登录
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbital orbit-one" />
          <div className="orbital orbit-two" />
          <svg viewBox="0 0 440 330">
            <g stroke="#94b9ac" strokeWidth="1" opacity=".55">
              <path
                d="M220 164 104 90 68 200 165 270 326 250 371 113 220 164 104 90 280 46 371 113M220 164 165 270M220 164 326 250M220 164 280 46M68 200 220 164"
                fill="none"
              />
            </g>
            {[
              [104, 90, 9],
              [68, 200, 7],
              [165, 270, 10],
              [326, 250, 8],
              [371, 113, 11],
              [280, 46, 6],
            ].map(([x, y, r], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={r + 13} fill="#e3eee7" />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={i % 2 ? "#8cae9e" : "#3b8b75"}
                />
              </g>
            ))}
            <circle cx="220" cy="164" r="66" fill="#f5f9f2" stroke="#bbd2c5" />
            <circle cx="220" cy="164" r="55" fill="#fff" stroke="#d9e5da" />
            <text
              x="220"
              y="164"
              textAnchor="middle"
              fill="#27654e"
              fontSize="36"
              fontFamily="Georgia,serif"
            >
              12
            </text>
            <text
              x="220"
              y="187"
              textAnchor="middle"
              fill="#7a9386"
              fontSize="9"
              letterSpacing="2"
            >
              HALLMARKS
            </text>
            <text x="95" y="55" fill="#789487" fontSize="10" letterSpacing="2">
              CONTEXT
            </text>
            <text
              x="294"
              y="302"
              fill="#789487"
              fontSize="10"
              letterSpacing="2"
            >
              CONNECTION
            </text>
          </svg>
          <span className="art-caption">A FRAMEWORK FOR EXPLORATION</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          [
            a.targets.length,
            "核心分子靶点",
            "符合原始功能研究收录规则",
            TargetIcon,
          ],
          [
            a.evidence.length,
            "可追溯实验依据",
            "保留物种、模型与干预条件",
            FlaskConical,
          ],
          [
            skin.length,
            "直接皮肤衰老关联",
            "与其他组织、损伤模型分开",
            ScanLine,
          ],
          [`${covered} / 12`, "分类已有条目", "完整导航，逐步扩充证据", Layers],
        ].map(([num, title, sub, Icon]) => {
          const I = Icon as typeof TargetIcon;
          return (
            <div className="stat" key={String(title)}>
              <span className="stat-icon">
                <I size={19} />
              </span>
              <div className="stat-number">{String(num)}</div>
              <b>{String(title)}</b>
              <small>{String(sub)}</small>
            </div>
          );
        })}
      </div>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE HALLMARKS OF AGING</div>
            <h2>从 12 类机制开始探索</h2>
            <p>基于 Cell 2023 年框架；分类可交叉，不代表单一因果路径。</p>
          </div>
          <Link className="text-link" to="/methods">
            框架与收录说明 <ArrowUpRight size={15} />
          </Link>
        </div>
        <form
          className="overview-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/targets?q=" + encodeURIComponent(q));
          }}
        >
          <Search size={19} />
          <input
            aria-label="探索搜索"
            placeholder="输入基因符号、中文名称、别名、通路或文献题名"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">
            搜索图谱 <ArrowRight size={16} />
          </button>
        </form>
        <div className="taxonomy-grid">
          {a.taxonomy.map((h, i) => {
            const Icon = icons[i];
            const n = a.targets.filter((t) =>
              t.taxonomyIds.includes(h.id),
            ).length;
            return (
              <Link
                key={h.id}
                className={`taxonomy-card ${n ? "" : "pending"}`}
                to={`/targets?mechanism=${h.id}`}
              >
                <div className="taxonomy-top">
                  <span className="taxonomy-icon" style={{ color: h.color }}>
                    <Icon size={23} />
                  </span>
                  <span className="taxonomy-number">
                    {String(h.number).padStart(2, "0")}
                  </span>
                </div>
                <h3>{h.name}</h3>
                <small>{h.englishName}</small>
                <div className="taxonomy-foot">
                  <span>{n ? `${n} 个核心靶点` : "尚未完成整理"}</span>
                  <ArrowUpRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="skin-banner">
        <div className="skin-emblem">
          <Leaf size={29} />
        </div>
        <div>
          <div className="eyebrow">SKIN RESEARCH FOCUS</div>
          <h3>聚焦皮肤衰老与研发关联</h3>
          <p>
            定位皮肤细胞、组织与动物证据。实验室读出与化妆品外用功效分开解读。
          </p>
        </div>
        <Link className="outline-btn" to="/targets?skin=skin_aging">
          浏览皮肤关联 <ArrowRight size={16} />
        </Link>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">CURATED STARTING POINTS</div>
            <h2>从这些研究条目出发</h2>
          </div>
          <Link className="text-link" to="/targets">
            查看全部靶点 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="target-grid">
          {featured.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      </section>
      <div className="home-note">
        <BookOpen size={19} />
        <p>
          <b>这是一份持续整理的科研图谱。</b> 数据核验由 Codex
          完成，不等于人工专家审核。尚未整理的分类不代表该领域没有研究。
          <Link to="/methods">查看数据覆盖与局限 →</Link>
        </p>
      </div>
    </>
  );
}
function Directory() {
  const { atlas: a } = useAtlas();
  const [params, setParams] = useSearchParams();
  const [advanced, setAdvanced] = useState(false);
  const [view, setView] = useState("cards");
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  function set(k: string, v: string) {
    setParams((p) => {
      if (v) p.set(k, v);
      else p.delete(k);
      if (k !== "page") p.delete("page");
      return p;
    });
  }
  const filter = (t: Target) => {
    const es = a.evidence.filter((e) => t.evidenceIds.includes(e.id));
    const val = (k: string) => params.get(k) || "";
    return (
      (!q ||
        q
          .split(/\s+/)
          .every((w) => targetCorpus(t, a).includes(normalize(w)))) &&
      (!val("mechanism") || t.taxonomyIds.includes(val("mechanism"))) &&
      (!val("pathway") || t.pathwayIds.includes(val("pathway"))) &&
      (!val("skin") || t.skinClassification === val("skin")) &&
      es.some(
        (e) =>
          (!val("species") || e.species.includes(val("species"))) &&
          (!val("evidence") || e.evidenceType.includes(val("evidence"))) &&
          (!val("model") || e.model === val("model")) &&
          (!val("tissue") || e.tissueCell === val("tissue")) &&
          (!val("phenotype") || e.phenotypeIds.includes(val("phenotype"))) &&
          (!val("intervention") ||
            e.interventionIds.some(
              (id) =>
                a.interventions.find((i) => i.id === id)?.category ===
                val("intervention"),
            )) &&
          (!val("year") ||
            String(
              a.publications.find((p) => p.id === e.publicationId)?.year,
            ) === val("year")),
      )
    );
  };
  const filtered = a.targets
    .filter(filter)
    .sort((x, y) =>
      params.get("sort") === "year"
        ? Math.max(
            ...y.evidenceIds.map(
              (id) =>
                a.publications.find(
                  (p) =>
                    p.id === a.evidence.find((e) => e.id === id)?.publicationId,
                )?.year || 0,
            ),
          ) -
          Math.max(
            ...x.evidenceIds.map(
              (id) =>
                a.publications.find(
                  (p) =>
                    p.id === a.evidence.find((e) => e.id === id)?.publicationId,
                )?.year || 0,
            ),
          )
        : x.symbol.localeCompare(y.symbol),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 9));
  const current = Math.min(Math.max(page, 1), pages);
  const entries = filtered.slice((current - 1) * 9, current * 9);
  const filtersCount = [...params.keys()].filter(
    (k) => !["page", "sort"].includes(k),
  ).length;
  function select(
    k: string,
    label: string,
    options: { id: string; name: string }[],
  ) {
    return (
      <label key={k}>
        {label}
        <select
          aria-label={label}
          value={params.get(k) || ""}
          onChange={(e) => set(k, e.target.value)}
        >
          <option value="">全部{label}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const opts = (items: string[]) =>
    [...new Set(items)].sort().map((x) => ({ id: x, name: x }));
  const exactAliases = q
    ? a.targets.filter((t) =>
        t.aliases.some((alias) => normalize(alias) === normalize(q)),
      )
    : [];
  return (
    <>
      <PageHeader
        eyebrow="TARGET DIRECTORY"
        title="靶点目录"
        description="按机制、模型与实验依据查阅具体分子。每个核心条目均关联原始功能研究。"
      >
        <button
          className="outline-btn"
          onClick={() =>
            exportData(a, filtered, "csv", params.toString() || "全部核心靶点")
          }
        >
          <Download size={15} />
          CSV
        </button>
        <button
          className="outline-btn"
          onClick={() =>
            exportData(a, filtered, "json", params.toString() || "全部核心靶点")
          }
        >
          JSON
        </button>
      </PageHeader>
      <section className="filter-panel">
        <form
          className="directory-search"
          onSubmit={(e) => {
            e.preventDefault();
            set("q", draft);
          }}
        >
          <Search size={19} />
          <input
            aria-label="目录搜索"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="基因符号、中文名、别名、通路、文献题名…"
          />
          <button className="primary-btn" type="submit">
            搜索
          </button>
        </form>
        <div className="filter-grid">
          {select("mechanism", "机制", a.taxonomy)}
          {select("pathway", "通路", a.pathways)}
          {select(
            "skin",
            "皮肤关联",
            Object.entries(skinLabels).map(([id, name]) => ({ id, name })),
          )}
          {select(
            "species",
            "物种",
            opts(a.evidence.flatMap((e) => e.species)),
          )}
          <button
            className={`filter-more ${advanced ? "selected" : ""}`}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={16} />
            {advanced ? "收起高级筛选" : "更多筛选"}
          </button>
        </div>
        {advanced && (
          <div className="filter-grid advanced">
            {select(
              "evidence",
              "证据类型",
              opts(a.evidence.flatMap((e) => e.evidenceType)),
            )}
            {select(
              "tissue",
              "组织或细胞",
              opts(a.evidence.map((e) => e.tissueCell)),
            )}
            {select("model", "研究模型", opts(a.evidence.map((e) => e.model)))}
            {select("phenotype", "表型", a.phenotypes)}
            {select(
              "intervention",
              "干预物类别",
              opts(a.interventions.map((i) => i.category)),
            )}
            {select(
              "year",
              "年份",
              opts(
                a.publications
                  .filter((p) => p.type === "original")
                  .map((p) => String(p.year)),
              ),
            )}
          </div>
        )}
        {filtersCount > 0 && (
          <div className="active-filters">
            <span>已应用 {filtersCount} 项搜索 / 筛选条件</span>
            <button
              onClick={() => {
                setParams({});
                setDraft("");
              }}
            >
              清除全部 <X size={13} />
            </button>
          </div>
        )}
      </section>
      {exactAliases.length > 1 && (
        <div className="alert">
          该别名匹配多个独立实体，请分别选择：
          {exactAliases.map((t) => (
            <Link key={t.id} to={`/targets/${t.id}`}>
              {t.symbol}　
            </Link>
          ))}
        </div>
      )}
      <div className="results-toolbar">
        <span>
          共 <b>{filtered.length}</b> 个核心靶点{" "}
          <small> / 全库 {a.targets.length}</small>
        </span>
        <div className="actions">
          <select
            aria-label="目录排序"
            value={params.get("sort") || "symbol"}
            onChange={(e) => set("sort", e.target.value)}
          >
            <option value="symbol">按标准符号 A–Z</option>
            <option value="year">按最新收录文献年份</option>
          </select>
          <div className="view-switch">
            <button
              aria-label="卡片视图"
              className={view === "cards" ? "selected" : ""}
              onClick={() => setView("cards")}
            >
              <Grid2X2 size={16} />
            </button>
            <button
              aria-label="列表视图"
              className={view === "list" ? "selected" : ""}
              onClick={() => setView("list")}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>
      {!entries.length ? (
        <Empty>
          <span>
            当前条件已保留。可以调整筛选，或
            <button className="text-link" onClick={() => setParams({})}>
              清除全部条件
            </button>
            。这不表示该领域没有科研证据。
          </span>
        </Empty>
      ) : view === "cards" ? (
        <div className="target-grid">
          {entries.map((t) => (
            <TargetCard target={t} key={t.id} />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>标准符号 / 名称</th>
                <th>关联机制</th>
                <th>模型 / 表型</th>
                <th>皮肤关联</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/targets/${t.id}`} className="symbol">
                      {t.symbol}
                    </Link>
                    <p>{t.name}</p>
                  </td>
                  <td>
                    {t.taxonomyIds
                      .map((id) => a.taxonomy.find((h) => h.id === id)?.name)
                      .join(" · ")}
                  </td>
                  <td>
                    {a.evidence
                      .filter((e) => t.evidenceIds.includes(e.id))
                      .map((e) => (
                        <p key={e.id}>
                          {e.model} · {e.endpoints.join(" / ")}
                        </p>
                      ))}
                  </td>
                  <td>{skinLabels[t.skinClassification]}</td>
                  <td>
                    <TargetActions t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <button
          disabled={current <= 1}
          aria-label="上一页"
          onClick={() => set("page", String(current - 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          第 {current} / {pages} 页
        </span>
        <button
          disabled={current >= pages}
          aria-label="下一页"
          onClick={() => set("page", String(current + 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
function TargetDetail() {
  const { id } = useParams();
  const { atlas: a, personal, setPersonal, toast } = useAtlas();
  const t = a.targets.find((t) => t.id === id);
  const [note, setNote] = useState("");
  useEffect(() => setNote(id ? personal.notes[id] || "" : ""), [id]);
  if (!t)
    return (
      <Empty title="条目不存在或尚未整理">
        该 ID 未在当前数据版本找到。个人笔记仍保存在收藏页，可导出备份。
        <Link to="/targets">返回目录</Link>
      </Empty>
    );
  const es = a.evidence.filter((e) => t.evidenceIds.includes(e.id));
  const pubs = a.publications.filter((p) =>
    es.some((e) => e.publicationId === p.id),
  );
  const interventions = a.interventions.filter((i) =>
    es.some((e) => e.interventionIds.includes(i.id)),
  );
  return (
    <>
      <Link
        className="back-link"
        to="/targets"
        onClick={(e) => {
          if (window.history.state?.idx > 0) {
            e.preventDefault();
            window.history.back();
          }
        }}
      >
        <ChevronLeft size={15} />
        返回浏览位置
      </Link>
      <div className="detail-hero">
        <div>
          <div className="eyebrow">GENE / PROTEIN · 核心功能研究条目</div>
          <h1>
            {t.symbol} <span>{t.name}</span>
          </h1>
          <p>{t.summary}</p>
          <div className="tags">
            {t.taxonomyIds.map((id) => (
              <Link key={id} to={`/targets?mechanism=${id}`}>
                <Tag>{a.taxonomy.find((h) => h.id === id)?.name}</Tag>
              </Link>
            ))}
            <Tag tone="green">{skinLabels[t.skinClassification]}</Tag>
          </div>
        </div>
        <TargetActions t={t} />
      </div>
      <div className="detail-tabs">
        <a
          href="#basic"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById("basic")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          基本介绍
        </a>
        <button
          onClick={() =>
            document
              .getElementById("network")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          关系网络
        </button>
        <button
          onClick={() =>
            document
              .getElementById("evidence")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          实验依据 <b>{es.length}</b>
        </button>
        <button
          onClick={() =>
            document
              .getElementById("references")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          文献与笔记
        </button>
        <div className="tab-spacer" />
        <button onClick={() => exportData(a, [t], "json", t.symbol)}>
          <Download size={14} />
          JSON
        </button>
        <button onClick={() => exportData(a, [t], "csv", t.symbol)}>CSV</button>
      </div>
      <div className="detail-columns">
        <section className="paper-section" id="basic">
          <h2>基本介绍与身份</h2>
          <dl className="identity-list">
            <dt>实体类型</dt>
            <dd>
              {t.entityType === "gene_protein"
                ? "具体基因 / 蛋白"
                : t.entityType}
            </dd>
            <dt>标准符号</dt>
            <dd>{t.symbol}</dd>
            <dt>别名</dt>
            <dd>{t.aliases.join("、") || "暂无整理"}</dd>
            <dt>名称核对</dt>
            <dd>
              {t.externalIds.length
                ? t.externalIds.map((x) => (
                    <a
                      key={x.database + x.id}
                      href={x.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {x.database}: {x.id} ↗　
                    </a>
                  ))
                : "身份以关联原始论文中的实体为依据；外部数据库 ID 尚未完成核验。"}
            </dd>
            <dt>跨物种汇总</dt>
            <dd>{t.orthologMapping}</dd>
            <dt>介绍依据</dt>
            <dd>
              {pubs.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                  {p.journal} {p.year} ↗　
                </a>
              ))}
            </dd>
          </dl>
          <details className="term-glossary">
            <summary>本页缩写与细胞模型释义</summary>
            <p>
              {Object.entries(glossary)
                .filter(([term]) =>
                  [
                    t.summary,
                    ...es.flatMap((e) => [
                      e.claim,
                      e.intervention,
                      e.result,
                      ...e.endpoints,
                    ]),
                  ]
                    .join(" ")
                    .includes(term),
                )
                .map(([term, meaning]) => (
                  <span key={term}>
                    <b>{term}</b>：{meaning}；{" "}
                  </span>
                ))}
            </p>
          </details>
          <h3>研究支持了什么</h3>
          {es.map((e) => (
            <p key={e.id}>
              <a
                href={`#${e.id}`}
                onClick={(ev) => {
                  ev.preventDefault();
                  document.getElementById(e.id)?.scrollIntoView();
                }}
                className="inline-eid"
              >
                {e.id}
              </a>
              {e.claim}
            </p>
          ))}
        </section>
        <section className="paper-section skin-section">
          <div className="eyebrow">
            <Leaf size={14} />
            SKIN RELEVANCE
          </div>
          <h2>皮肤关联</h2>
          <Tag tone="green">{skinLabels[t.skinClassification]}</Tag>
          <p>{t.skinSummary}</p>
          <div className="boundary-note">
            人体、动物和细胞证据分别解释。原料或药物的实验关联，不自动证明化妆品外用抗衰功效。
          </div>
          <h3>参与通路 / 研究主题</h3>
          {t.pathwayIds.map((id) => {
            const p = a.pathways.find((p) => p.id === id);
            return p ? (
              <Link className="pathway-chip" key={id} to={`/pathways/${id}`}>
                {p.name}
                <ArrowUpRight size={14} />
              </Link>
            ) : null;
          })}
        </section>
      </div>
      <section id="network" className="detail-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LOCAL RELATIONSHIP NETWORK</div>
            <h2>局部关系图</h2>
          </div>
          <Link className="text-link" to={`/graph?root=${t.id}`}>
            在完整工作区打开 <ArrowUpRight size={14} />
          </Link>
        </div>
        <Graph targetId={t.id} compact />
      </section>
      <section id="evidence" className="detail-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXPERIMENTAL EVIDENCE</div>
            <h2>实验依据与条件依赖</h2>
            <p>
              按原始实验描述干预与终点，不为靶点赋予永久固定的“抗衰 /
              促衰”属性。
            </p>
          </div>
        </div>
        {es.map((e) => (
          <EvidenceCard key={e.id} e={e} />
        ))}
      </section>
      <section className="detail-section">
        <h2>相关干预物</h2>
        {interventions.length ? (
          <div className="intervention-grid">
            {interventions.map((i) => (
              <div className="paper-section" key={i.id}>
                <Tag>{i.category}</Tag>
                <h3>{i.name}</h3>
                <p>{i.identity}</p>
                <p>
                  <b>原文途径 / 处理：</b>
                  {i.route}
                </p>
                {es
                  .filter((e) => e.interventionIds.includes(i.id))
                  .map((e) => (
                    <p key={e.id}>
                      <b>关系依据：</b>
                      {e.intervention}
                      <br />
                      {e.id} · {e.limitations}
                    </p>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="boundary-note">
            该条目尚未整理经核验的可干预分子或原料。遗传干预依据请见上表。
          </div>
        )}
      </section>
      <section id="references" className="detail-section">
        <div className="section-heading">
          <h2>相关原始文献</h2>
          <button
            className="outline-btn"
            onClick={() => ris(pubs, a, t.symbol)}
          >
            <Download size={14} />
            导出 RIS
          </button>
        </div>
        {pubs.map((p) => (
          <PubCard p={p} key={p.id} />
        ))}
      </section>
      <section className="paper-section notes-editor">
        <h2>我的研究笔记</h2>
        <p>保存在当前浏览器，可导出备份。不会混入公共科研数据导出。</p>
        <textarea
          aria-label="靶点笔记"
          placeholder="记录你的研究问题、对照设计或后续阅读线索…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="actions">
          <button
            className="primary-btn"
            onClick={() => {
              if (
                setPersonal({
                  ...personal,
                  notes: { ...personal.notes, [t.id]: note },
                })
              )
                toast("笔记已保存在当前浏览器。");
            }}
          >
            <Check size={15} />
            保存笔记
          </button>
          {personal.notes[t.id] !== undefined && (
            <button
              className="small-btn"
              onClick={() => {
                if (
                  confirm(
                    "删除该条目的个人笔记？此操作可通过之前导出的备份恢复。",
                  )
                ) {
                  const notes = { ...personal.notes };
                  delete notes[t.id];
                  setPersonal({ ...personal, notes });
                  setNote("");
                }
              }}
            >
              删除笔记
            </button>
          )}
        </div>
      </section>
    </>
  );
}
function Pathways() {
  const { atlas: a, personal, toggleFavorite } = useAtlas();
  const [q, setQ] = useState("");
  const entries = a.pathways.filter((p) =>
    normalize(
      p.name +
        " " +
        p.summary +
        " " +
        p.memberIds.map((id) => entity(a, id)?.name).join(" "),
    ).includes(normalize(q)),
  );
  return (
    <>
      <PageHeader
        eyebrow="PATHWAY DIRECTORY"
        title="通路目录"
        description="在研究主题中查看共享靶点。归属关系与实验调控关系分别表达。"
      >
        <button className="outline-btn" onClick={() => exportPathways(a)}>
          <Download size={15} />
          通路 CSV
        </button>
        <button
          className="outline-btn"
          onClick={() =>
            download(
              JSON.stringify(
                {
                  metadata: exportMeta(a, "全部通路"),
                  pathways: a.pathways,
                  relations: a.relations.filter((r) =>
                    a.pathways.some(
                      (p) => p.id === r.targetId || p.id === r.sourceId,
                    ),
                  ),
                },
                null,
                2,
              ),
              "aging-atlas-pathways.json",
            )
          }
        >
          JSON
        </button>
      </PageHeader>
      <div className="simple-search">
        <Search size={18} />
        <input
          aria-label="通路搜索"
          placeholder="查找通路名称、功能或成员"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="pathway-grid">
        {entries.map((p, i) => (
          <article className="pathway-card" key={p.id}>
            <div className="section-line">
              <span className="taxonomy-icon">
                <Workflow size={24} />
              </span>
              <button
                className="icon-btn"
                aria-label={`收藏通路 ${p.name}`}
                onClick={() => toggleFavorite(p.id)}
              >
                <Bookmark
                  size={16}
                  fill={
                    personal.favorites.includes(p.id) ? "currentColor" : "none"
                  }
                />
              </button>
            </div>
            <small className="eyebrow">
              PATHWAY {String(i + 1).padStart(2, "0")}
            </small>
            <Link to={`/pathways/${p.id}`}>
              <h2>
                {p.name}
                <ArrowUpRight size={18} />
              </h2>
            </Link>
            <p>{p.summary}</p>
            <div className="tags">
              {p.memberIds.map((id) => (
                <Link key={id} to={`/targets/${id}`}>
                  <Tag>{a.targets.find((t) => t.id === id)?.symbol}</Tag>
                </Link>
              ))}
            </div>
            <div className="pathway-card-foot">
              {p.memberIds.length} 个已收录靶点 · <Tag>研究主题 / 机制背景</Tag>
            </div>
          </article>
        ))}
      </div>
      {!entries.length && <Empty />}
    </>
  );
}
function PathwayDetail() {
  const { id } = useParams();
  const { atlas: a, personal, toggleFavorite, setPersonal, toast } = useAtlas();
  const p = a.pathways.find((p) => p.id === id);
  const [note, setNote] = useState("");
  useEffect(() => setNote(id ? personal.notes[id] || "" : ""), [id]);
  if (!p) return <Empty title="通路尚未整理" />;
  const targets = a.targets.filter((t) => p.memberIds.includes(t.id));
  const es = a.evidence.filter((e) =>
    targets.some((t) => t.evidenceIds.includes(e.id)),
  );
  const pubs = a.publications.filter((p) =>
    es.some((e) => e.publicationId === p.id),
  );
  const overlaps = a.pathways.filter(
    (other) =>
      other.id !== p.id &&
      other.memberIds.some((id) => p.memberIds.includes(id)),
  );
  return (
    <>
      <Link className="back-link" to="/pathways">
        <ChevronLeft size={15} />
        返回通路目录
      </Link>
      <PageHeader
        eyebrow="PATHWAY / RESEARCH THEME"
        title={p.name}
        description={p.summary}
      >
        <button className="outline-btn" onClick={() => toggleFavorite(p.id)}>
          <Bookmark size={15} />
          {personal.favorites.includes(p.id) ? "已收藏" : "收藏通路"}
        </button>
        <button
          className="outline-btn"
          onClick={() => exportData(a, targets, "json", p.name)}
        >
          <Download size={15} />
          导出相关数据
        </button>
      </PageHeader>
      <div className="boundary-note">
        {p.mappingBasis}{" "}
        共享成员不等于存在直接调控。数据库背景关系不计入衰老实验因果边。
      </div>
      <div className="tags roomy">
        {p.taxonomyIds.map((id) => (
          <Tag key={id}>{a.taxonomy.find((h) => h.id === id)?.name}</Tag>
        ))}
      </div>
      <Graph targetId={p.id} />
      <section className="detail-section">
        <h2>已收录成员</h2>
        <div className="target-grid">
          {targets.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      </section>
      <section className="paper-section">
        <h2>通路交叉与共享节点</h2>
        {overlaps.length ? (
          overlaps.map((o) => (
            <div className="overlap-row" key={o.id}>
              <Link to={`/pathways/${o.id}`}>{o.name} ↗</Link>
              <span>
                共享：
                {o.memberIds
                  .filter((id) => p.memberIds.includes(id))
                  .map((id) => a.targets.find((t) => t.id === id)?.symbol)
                  .join("、")}
              </span>
            </div>
          ))
        ) : (
          <p>当前收录数据中尚未建立共享节点映射。</p>
        )}
        <h3>机制背景来源</h3>
        {p.backgroundSourceIds.map((id) => {
          const s = a.sources.find((s) => s.id === id);
          return s ? (
            <p key={id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.name} ↗
              </a>{" "}
              · {s.role}
            </p>
          ) : null;
        })}
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <h2>相关原始研究</h2>
          <button className="small-btn" onClick={() => ris(pubs, a, p.name)}>
            导出 RIS
          </button>
        </div>
        {pubs.map((p) => (
          <PubCard p={p} key={p.id} />
        ))}
      </section>
      <section className="paper-section notes-editor">
        <h2>通路研究笔记</h2>
        <p>保存在当前浏览器，可导出备份。</p>
        <textarea
          aria-label="通路笔记"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          className="primary-btn"
          onClick={() => {
            if (
              setPersonal({
                ...personal,
                notes: { ...personal.notes, [p.id]: note },
              })
            )
              toast("笔记已保存在当前浏览器。");
          }}
        >
          保存笔记
        </button>
      </section>
    </>
  );
}
function GraphPage() {
  return (
    <>
      <PageHeader
        eyebrow="INTERACTIVE NETWORK"
        title="交互图谱工作区"
        description="从一个节点出发，逐层查看关系、实验条件与来源。默认突出衰老功能实验。"
      />
      <Graph />
    </>
  );
}
function Compare() {
  const { atlas: a, compare, toggleCompare } = useAtlas();
  const [add, setAdd] = useState("");
  const targets = a.targets.filter((t) => compare.includes(t.id));
  const common = a.pathways.filter(
    (p) =>
      targets.length >= 2 && targets.every((t) => t.pathwayIds.includes(p.id)),
  );
  const ids = new Set(compare);
  const direct = a.relations.filter(
    (r) =>
      r.scope === "aging_experiment" &&
      ids.has(r.sourceId) &&
      ids.has(r.targetId),
  );
  const rows = [
    [
      "实体类型",
      (t: Target) =>
        t.entityType === "gene_protein" ? "具体基因 / 蛋白" : t.entityType,
    ],
    [
      "关联机制",
      (t: Target) =>
        t.taxonomyIds
          .map((id) => a.taxonomy.find((h) => h.id === id)?.name)
          .join("；"),
    ],
    [
      "通路 / 研究主题",
      (t: Target) =>
        t.pathwayIds
          .map((id) => a.pathways.find((p) => p.id === id)?.name)
          .join("；"),
    ],
    [
      "物种与模型",
      (t: Target) =>
        a.evidence
          .filter((e) => t.evidenceIds.includes(e.id))
          .map((e) => `${e.species.join("/")} · ${e.model}`)
          .join("\n"),
    ],
    [
      "表型与检测指标",
      (t: Target) =>
        [
          ...new Set(
            a.evidence
              .filter((e) => t.evidenceIds.includes(e.id))
              .flatMap((e) => e.endpoints),
          ),
        ].join("；"),
    ],
    [
      "干预物 / 实验干预",
      (t: Target) =>
        a.evidence
          .filter((e) => t.evidenceIds.includes(e.id))
          .map((e) => e.intervention)
          .join("\n"),
    ],
    [
      "皮肤证据",
      (t: Target) => `${skinLabels[t.skinClassification]}。${t.skinSummary}`,
    ],
    [
      "证据类型",
      (t: Target) =>
        [
          ...new Set(
            a.evidence
              .filter((e) => t.evidenceIds.includes(e.id))
              .flatMap((e) => e.evidenceType),
          ),
        ].join("；"),
    ],
    [
      "主要局限",
      (t: Target) =>
        a.evidence
          .filter((e) => t.evidenceIds.includes(e.id))
          .map((e) => e.limitations)
          .join("\n"),
    ],
  ] as const;
  return (
    <>
      <PageHeader
        eyebrow="TARGET COMPARISON"
        title="靶点对比"
        description="同时比较 2–4 个靶点，寻找共享研究主题与模型差异。"
      >
        <button
          disabled={!targets.length}
          className="outline-btn"
          onClick={() =>
            exportData(
              a,
              targets,
              "json",
              "对比:" + targets.map((t) => t.symbol).join(","),
            )
          }
        >
          <Download size={15} />
          对比 JSON
        </button>
        <button
          disabled={!targets.length}
          className="outline-btn"
          onClick={() =>
            exportData(
              a,
              targets,
              "csv",
              "对比:" + targets.map((t) => t.symbol).join(","),
            )
          }
        >
          CSV
        </button>
      </PageHeader>
      <div className="compare-selector">
        <select
          aria-label="添加对比靶点"
          value={add}
          onChange={(e) => setAdd(e.target.value)}
        >
          <option value="">选择一个靶点加入对比</option>
          {a.targets
            .filter((t) => !compare.includes(t.id))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.symbol} · {t.name}
              </option>
            ))}
        </select>
        <button
          disabled={!add}
          className="primary-btn"
          onClick={() => {
            toggleCompare(add);
            setAdd("");
          }}
        >
          加入对比
        </button>
        <span>{targets.length} / 4 已选</span>
      </div>
      {targets.length < 2 && (
        <Empty title="请至少选择两个靶点">
          从上方选择，或在目录卡片中点击“对比”。
        </Empty>
      )}
      {targets.length > 0 && (
        <div className="table-wrap compare-table">
          <table>
            <thead>
              <tr>
                <th>对比维度</th>
                {targets.map((t) => (
                  <th key={t.id}>
                    <Link to={`/targets/${t.id}`}>{t.symbol} ↗</Link>
                    <p>{t.name}</p>
                    <button
                      className="small-btn"
                      onClick={() => toggleCompare(t.id)}
                    >
                      <X size={13} />
                      移除
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, get]) => (
                <tr key={label}>
                  <th>{label}</th>
                  {targets.map((t) => (
                    <td key={t.id}>{get(t)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {targets.length >= 2 && (
        <section className="paper-section">
          <h2>共同通路与已核实连接</h2>
          <p>
            <b>共同通路 / 主题：</b>
            {common.map((p) => p.name).join("；") ||
              "当前收录映射中未找到所有所选靶点共享的通路。"}
          </p>
          <p>
            {direct.length
              ? direct.map((r) => r.label + "（" + r.context + "）").join("；")
              : "所选靶点之间尚无已入库的直接功能调控连线。共同分类、共同表型或共享通路均不等于已证明直接调控。"}
          </p>
          <h3>各自特有的通路映射</h3>
          {targets.map((t) => (
            <p key={t.id}>
              <b>{t.symbol}：</b>
              {t.pathwayIds
                .filter((id) =>
                  targets.every(
                    (other) =>
                      other.id === t.id || !other.pathwayIds.includes(id),
                  ),
                )
                .map((id) => a.pathways.find((p) => p.id === id)?.name)
                .join("；") || "无当前所选集合中特有的映射"}
            </p>
          ))}
        </section>
      )}
    </>
  );
}
function Library() {
  const { atlas: a, personal, setPersonal, toggleFavorite, toast } = useAtlas();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [pending, setPending] = useState<ReturnType<
    typeof validateBackup
  > | null>(null);
  const [edit, setEdit] = useState("");
  const [text, setText] = useState("");
  const known = [...a.targets, ...a.pathways, ...a.publications];
  const all = [
    ...new Set([...personal.favorites, ...Object.keys(personal.notes)]),
  ];
  const filtered = all.filter((id) => {
    const e = known.find((e) => e.id === id);
    return (
      (tab === "all" ||
        (tab === "notes" && Boolean(personal.notes[id])) ||
        (tab === "targets" && a.targets.some((t) => t.id === id)) ||
        (tab === "pathways" && a.pathways.some((p) => p.id === id)) ||
        (tab === "publications" && a.publications.some((p) => p.id === id))) &&
      normalize(
        (e
          ? "title" in e
            ? e.title
            : ("symbol" in e ? e.symbol + " " : "") + e.name
          : id) +
          " " +
          (personal.notes[id] || ""),
      ).includes(normalize(q))
    );
  });
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("备份文件超过 5 MB 限制。");
      const incoming = validateBackup(JSON.parse(await file.text()));
      setPending(incoming);
    } catch (e) {
      toast(e instanceof Error ? e.message : "备份读取失败");
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="MY RESEARCH LIBRARY"
        title="收藏与笔记"
        description="保存在当前浏览器，可导出备份。不会自动上传或跨设备同步。"
      >
        <button
          className="outline-btn"
          onClick={() =>
            download(
              JSON.stringify(
                {
                  ...personal,
                  exportedAt: new Date().toISOString(),
                  dataVersion: a.manifest.version,
                },
                null,
                2,
              ),
              "aging-atlas-personal-backup.json",
            )
          }
        >
          <Download size={15} />
          导出备份
        </button>
        <label className="outline-btn file-label">
          <Upload size={15} />
          导入备份
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </PageHeader>
      {pending && (
        <div className="import-panel" role="region" aria-label="备份导入预览">
          <h3>导入前预览</h3>
          <p>
            {pending.favorites.length} 项收藏、
            {Object.keys(pending.notes).length} 项笔记。合并会保留现有同 ID
            笔记，新增收藏取并集；不会覆盖既有笔记。
          </p>
          <div className="actions">
            <button
              className="primary-btn"
              onClick={() => {
                if (setPersonal(mergeBackup(personal, pending))) {
                  setPending(null);
                  toast("备份已合并，现有同 ID 笔记优先保留。");
                }
              }}
            >
              合并导入
            </button>
            <button className="small-btn" onClick={() => setPending(null)}>
              取消
            </button>
          </div>
        </div>
      )}
      <div className="library-tabs">
        {[
          ["all", "全部记录"],
          ["targets", "靶点"],
          ["pathways", "通路"],
          ["publications", "文献"],
          ["notes", "有笔记"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="simple-search">
        <Search size={17} />
        <input
          aria-label="搜索收藏与笔记"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索收藏名称或笔记内容"
        />
      </div>
      {!filtered.length ? (
        <Empty title="这里还没有匹配的研究记录">
          在靶点、通路或文献中点击收藏，或写下第一条笔记。
        </Empty>
      ) : (
        <div className="library-list">
          {filtered.map((id) => {
            const e = known.find((e) => e.id === id);
            const t = a.targets.find((t) => t.id === id);
            const p = a.pathways.find((p) => p.id === id);
            const pub = a.publications.find((p) => p.id === id);
            const title = e
              ? "title" in e
                ? e.title
                : ("symbol" in e ? e.symbol + " · " : "") + e.name
              : id;
            return (
              <article className="library-item" key={id}>
                <div className="section-line">
                  <Tag>
                    {t ? "靶点" : p ? "通路" : pub ? "文献" : "旧版本记录"}
                  </Tag>
                  <div className="actions">
                    <button
                      className="small-btn"
                      onClick={() => {
                        setEdit(id);
                        setText(personal.notes[id] || "");
                      }}
                    >
                      编辑笔记
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`切换收藏 ${id}`}
                      onClick={() => toggleFavorite(id)}
                    >
                      <Bookmark
                        size={16}
                        fill={
                          personal.favorites.includes(id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                </div>
                {t || p ? (
                  <Link
                    className="library-title"
                    to={`/${t ? "targets" : "pathways"}/${id}`}
                  >
                    {title} ↗
                  </Link>
                ) : pub ? (
                  <a
                    className="library-title"
                    href={pub.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {title} ↗
                  </a>
                ) : (
                  <h3>{title}</h3>
                )}
                {!e && (
                  <p className="alert">
                    当前版本未找到此
                    ID。收藏与笔记已保留，请核对迁移关系；不会静默删除。
                  </p>
                )}
                {edit === id ? (
                  <div className="notes-editor">
                    <textarea
                      aria-label={`编辑笔记 ${id}`}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    <div className="actions">
                      <button
                        className="primary-btn"
                        onClick={() => {
                          if (
                            setPersonal({
                              ...personal,
                              notes: { ...personal.notes, [id]: text },
                            })
                          )
                            setEdit("");
                        }}
                      >
                        保存
                      </button>
                      <button className="small-btn" onClick={() => setEdit("")}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : personal.notes[id] ? (
                  <p className="note-text">{personal.notes[id]}</p>
                ) : (
                  <p className="muted">尚未添加笔记</p>
                )}
                {Object.hasOwn(personal.notes, id) && (
                  <button
                    className="danger-text"
                    onClick={() => {
                      if (confirm("确认删除这条个人笔记？")) {
                        const notes = { ...personal.notes };
                        delete notes[id];
                        setPersonal({ ...personal, notes });
                      }
                    }}
                  >
                    删除这条笔记
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
      <div className="privacy-foot">
        <ShieldCheck size={16} />{" "}
        公共数据导出与个人笔记备份分别处理。导入前校验结构，合并冲突时保留当前笔记。
      </div>
    </>
  );
}
function Methods() {
  const { atlas: a } = useAtlas();
  return (
    <>
      <PageHeader
        eyebrow="METHODS & DATA PROVENANCE"
        title="方法与数据说明"
        description="明确收录依据、模型边界与整理进度，让图谱中的每一项主张可追溯。"
      />
      <div className="method-summary">
        <div>
          <ShieldCheck size={25} />
          <h3>基于原始功能研究</h3>
          <p>{a.manifest.reviewStatus}</p>
        </div>
        <div>
          <FileText size={25} />
          <h3>独立版本，公开来源</h3>
          <p>
            数据 {a.manifest.version} · 整理日期 {a.manifest.updated}
            。文献存在性与结论核对状态分别记录。
          </p>
        </div>
        <div>
          <FlaskConical size={25} />
          <h3>实验条件决定解释</h3>
          <p>
            细胞衰老、组织功能、健康寿命与机体寿命分别表述。动物或细胞结果不直接外推人体功效。
          </p>
        </div>
      </div>
      <section className="paper-section prose">
        <h2>框架与收录规则</h2>
        <p>
          分类起点为 López-Otín 等 2023 年发表于 Cell 的{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/36599349/"
            target="_blank"
            rel="noreferrer"
          >
            Hallmarks of aging: An expanding universe
          </a>
          。这是一套可扩展的工作框架，不表示截至当前唯一、最终或穷尽性的分类；标签本身不等于特定因果作用。
        </p>
        <p>
          正式核心条目至少有一篇已核验的原始功能研究，包含对靶点的遗传干预，或机制匹配且有依据的药理干预，同时具有明确的衰老情境与相应结果。仅表达差异、组学富集、相关性、网络药理学、分子对接及非衰老模型中的间接保护指标，均不足以单独满足入库标准。
        </p>
        <p>
          综述和数据库用于框架与追溯；具体主张由原始研究支持。药理干预不自动证明特异性；靶点依赖不等于直接结合；磷酸化变化按原文位点和读出解释。缺失的剂量、时长、样本量明确记为“当前未获取”“原文未报告”或“不适用”。
        </p>
        <h3>常用缩写与细胞模型</h3>
        <p>
          {Object.entries(glossary).map(([term, meaning]) => (
            <span key={term}>
              <b>{term}</b>（{meaning}）；{" "}
            </span>
          ))}
        </p>
        <h3>图谱阅读</h3>
        <p>
          实线为衰老功能实验关系，虚线为通路机制背景。→ 表示有依据的调控方向，⊣
          表示抑制；无方向的关联或归属不画因果箭头。靶点到表型的连线说明具体干预下的观测，不能解释成该分子恒定的作用方向。背景归属含明确标注的编辑主题映射，不自动证明通路成员的生化调控。
        </p>
        <p>
          二层扩展可能连接不同论文、物种或模型，只称“跨研究关联路径”。不由 A→B
          与 B→C
          推定已验证完整信号顺序。图中节点大小和文献数量不代表效果或证据强度；颜色仅辅助阅读。
        </p>
        <h3>皮肤与化妆品解释边界</h3>
        <p>
          直接皮肤衰老实验、皮肤相关损伤、其他组织研究和尚未评估分开标注。急性紫外损伤不自动视为自然老化；体外胶原读出、动物给药或口服/注射结果均不自动证明化妆品外用抗衰功效。
        </p>
      </section>
      <section className="paper-section">
        <h2>真实收录与覆盖缺口</h2>
        <p>{a.manifest.coverage}</p>
        <p>{a.manifest.searchScope}</p>
        <div className="coverage-table">
          <table>
            <thead>
              <tr>
                <th>分类</th>
                <th>已入库核心靶点</th>
                <th>整理状态</th>
              </tr>
            </thead>
            <tbody>
              {a.taxonomy.map((h) => {
                const n = a.targets.filter((t) =>
                  t.taxonomyIds.includes(h.id),
                ).length;
                return (
                  <tr key={h.id}>
                    <td>
                      <Link to={`/targets?mechanism=${h.id}`}>
                        {h.number}. {h.name}
                      </Link>
                    </td>
                    <td>{n}</td>
                    <td>{n ? "部分覆盖，继续扩充" : "尚未完成整理"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <h3>已知缺口</h3>
        <ul>
          {a.manifest.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <p>
          结构校验检查唯一
          ID、引用和语义约束，不能自动核实科学正确性，也不等同专家审核。
        </p>
      </section>
      <section className="paper-section">
        <h2>数据来源与使用</h2>
        {a.sources.map((s) => (
          <div key={s.id} className="source-row">
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name}
              <ExternalLink size={13} />
            </a>
            <p>{s.role}</p>
            <small>访问核对 {s.checkedDate}</small>
          </div>
        ))}
        <p>
          站点保存原创中文概述、必要结构化事实和出处链接，不转载论文图表或全文。数据库有独立使用条款，扩充时须逐一检查。
        </p>
        <div className="actions">
          <a
            className="outline-btn"
            href={`${import.meta.env.BASE_URL}data/search-log.json`}
            download
          >
            下载检索记录 JSON
          </a>
          <a
            className="outline-btn"
            href={`${import.meta.env.BASE_URL}data/atlas.json`}
            download
          >
            下载完整公共数据库 JSON
          </a>
          <a
            className="outline-btn"
            href={`${import.meta.env.BASE_URL}data/atlas.schema.json`}
            download
          >
            下载 JSON Schema
          </a>
        </div>
      </section>
      <section className="paper-section prose">
        <h2>使用与更新</h2>
        <p>
          目录支持中文、英文、标准符号、别名、通路和文献题名搜索；组合筛选在同一条证据记录内匹配物种、模型和检测条件，避免把不同实验的条件拼接。详情页和通路页支持直接链接与刷新。
        </p>
        <p>
          个人收藏和笔记仅存在当前浏览器。清理浏览器、换电脑或隐私模式结束可能使其不可用，请在“收藏与笔记”中导出
          JSON 备份。导入先预览，默认保留当前同 ID
          笔记，并合并收藏；数据更新后未找到的旧 ID 仍可见。
        </p>
        <p>
          公共 CSV 使用 UTF-8 BOM 并转义引号、换行和公式前缀；JSON
          保留证据、关系条件和来源；RIS 可导入文献管理器。PNG
          导出将标题、图例、条件、版本和来源真实合成到图片中。
        </p>
        <p>
          更新由用户按需发起：检索 → 核验 → 合并稳定 ID → 记录变更 → 数据检查 →
          构建发布。首版没有自动定时检索、后台审核或运行时大模型接口。
        </p>
      </section>
    </>
  );
}
