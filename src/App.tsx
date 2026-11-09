import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
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
  PaperLinks,
} from "./components";
import { AtlasSearchForm, SearchPage, CoveragePage, PathwayEvidenceTable, pathwayStudies } from "./ResearchViews";
import { PathwayDiagram } from "./PathwayDiagram";
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
  ["/pathways", "通路图册", Workflow],
  ["/search?type=publications", "文献索引", FileText],
  ["/coverage", "覆盖清单", List],
  ["/mechanisms/mechanism-ecm", "ECM 机制", Layers],
  ["/graph", "交互图谱", Network],
  ["/compare", "靶点对比", GitCompareArrows],
  ["/library", "收藏与笔记", Bookmark],
  ["/methods", "方法与数据", BookOpen],
] as const;
export default function App() {
  const { atlas: a, compare } = useAtlas();
  const loc = useLocation();
  const [mobile, setMobile] = useState(false);
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
  const title = loc.pathname === "/search" ? "文献与检索" :
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
          {loc.pathname !== "/" && loc.pathname !== "/search" && <AtlasSearchForm compact />}
          <Link className="help-link" to="/methods" aria-label="使用与数据说明">
            <CircleHelp size={19} />
          </Link>
        </header>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<div className="empty">正在载入图谱模块…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/coverage" element={<CoveragePage />} />
              <Route path="/targets" element={<Directory />} />
              <Route path="/targets/:id" element={<TargetDetail />} />
              <Route path="/pathways" element={<Pathways />} />
              <Route path="/pathways/:id" element={<PathwayDetail />} />
              <Route path="/mechanisms/:id" element={<MechanismDetail />} />
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
  const hallmarks = a.taxonomy.filter((h) => h.kind === "hallmark");
  return (
    <div className="research-page home-v2">
      <section className="home-search-hero">
        <h1>抗衰靶点与通路图谱</h1>
        <p>查找衰老机制、分子靶点和原始研究。</p>
        <AtlasSearchForm />
        <div className="home-quick-links">
          <Link to="/targets">全部靶点 <ArrowRight size={14} /></Link>
          <Link to="/pathways">通路图册 <ArrowRight size={14} /></Link>
          <Link to="/search?type=publications">文献索引 <ArrowRight size={14} /></Link>
          <Link to="/targets?skin=skin_aging">皮肤衰老 <ArrowRight size={14} /></Link>
        </div>
        <p className="home-counts">{a.targets.length} 个核心靶点 · {a.pathways.length} 个通路与研究主题 · {a.manifest.counts.originalPublications} 篇原始研究</p>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div><h2>从 12 类机制开始探索</h2><p>Cell 2023 衰老标志</p></div>
          <Link className="text-link" to="/coverage">查看覆盖清单 <ArrowUpRight size={16} /></Link>
        </div>
        <div className="taxonomy-grid">
          {hallmarks.map((h, i) => {
            const Icon = icons[i];
            const targets = a.targets.filter((t) => t.taxonomyIds.includes(h.id)).length;
            const theme = targets === 0 ? a.pathways.find((p) => p.taxonomyIds.includes(h.id) && a.themeStudies.some((e) => e.pathwayId === p.id)) : undefined;
            return <Link key={h.id} className="taxonomy-card" to={theme ? `/pathways/${theme.id}` : `/targets?mechanism=${h.id}`}>
              <span className="taxonomy-icon" style={{ color: h.color }}><Icon size={19} /></span>
              <div><h3>{h.name}</h3><small>{theme ? `${a.themeStudies.filter((e) => e.pathwayId === theme.id).length} 条主题研究` : `${targets} 个核心靶点`}</small></div>
              <ArrowUpRight size={16} />
            </Link>;
          })}
        </div>
      </section>
      {a.taxonomy.filter((h) => h.kind === "extension").map((h) => <section className="extension-banner" key={h.id}>
        <div className="extension-icon"><Layers size={25} /></div>
        <div><h2>{h.name}</h2><p>胶原周转、基底膜黏附与细胞—基质反馈。</p></div>
        <Link className="outline-btn" to={`/mechanisms/${h.id}`}>探索 ECM 机制 <ArrowRight size={15} /></Link>
      </section>)}
    </div>
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
      params.get("sort") !== "year" && q && (normalize(x.symbol) === normalize(q)) !== (normalize(y.symbol) === normalize(q))
        ? Number(normalize(y.symbol) === normalize(q)) - Number(normalize(x.symbol) === normalize(q))
        : params.get("sort") === "year"
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
          {select(
            "mechanism",
            "机制",
            a.taxonomy.map((h) => ({
              ...h,
              name: h.name + (h.kind === "extension" ? " · 扩展机制" : ""),
            })),
          )}
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
  const [showGraph, setShowGraph] = useState(false);
  const [params] = useSearchParams();
  const requestedEvidence = params.get("evidence");
  useEffect(() => {
    if (!requestedEvidence) return;
    const timer = window.setTimeout(() => document.getElementById(requestedEvidence)?.scrollIntoView({ block: "start" }), 100);
    return () => window.clearTimeout(timer);
  }, [id, requestedEvidence]);
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
  const preferred = es.find((e) => e.studyContext === "aging_function");
  const representative = pubs.find((p) => p.id === preferred?.publicationId);
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
          <p>{preferred?.claim || t.summary}</p>
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
      {representative && preferred && <section className="research-feature">
        <div>
          <span className="row-label">代表研究 · {preferred.species.join(" / ")}</span>
          <h2>{preferred.model}</h2>
          <p>{preferred.result}</p>
          <a className="representative-title" href={representative.url} target="_blank" rel="noreferrer">{representative.title} <ExternalLink size={15} /></a>
          <PaperLinks p={representative} />
        </div>
        <div className="actions">
          <button className="outline-btn" onClick={() => document.getElementById("references")?.scrollIntoView()}>查看全部论文（{pubs.length}）</button>
        </div>
      </section>}
      <nav className="detail-quick-nav" aria-label="靶点内容">
        <button className="small-btn" onClick={() => document.getElementById("evidence")?.scrollIntoView()}>实验记录（{es.length}）</button>
        {t.pathwayIds.map((id) => {
          const p = a.pathways.find((p) => p.id === id);
          return p && <Link className="small-btn" key={p.id} to={`/pathways/${p.id}`}>{p.name}</Link>;
        })}
      </nav>
      <section id="evidence" className="detail-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXPERIMENTAL EVIDENCE</div>
            <h2>实验依据与条件依赖</h2>
          </div>
        </div>
        {es.map((e) => (
          <EvidenceCard key={e.id} e={e} />
        ))}
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
      <details className="research-disclosure"><summary>靶点身份与研究背景</summary>
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
        </section>
        <section className="paper-section skin-section">
          <div className="eyebrow">
            <Leaf size={14} />
            SKIN RELEVANCE
          </div>
          <h2>皮肤关联</h2>
          <Tag tone="green">{skinLabels[t.skinClassification]}</Tag>
          <p>{es.filter((e) => /皮肤|真皮|表皮/.test(e.tissueCell)).map((e) => e.tissueCell).filter((cell, i, all) => all.indexOf(cell) === i).join("；") || "实验组织见各研究记录。"}</p>
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
      </details>
      <details className="research-disclosure" onToggle={(e) => setShowGraph(e.currentTarget.open)}>
        <summary>局部关系图</summary>
        {showGraph && <Suspense fallback={<p>正在载入图谱…</p>}><Graph targetId={t.id} compact /></Suspense>}
        <Link className="text-link" to={`/graph?root=${t.id}`}>在图谱中打开 <ArrowUpRight size={14} /></Link>
      </details>
      <details className="research-disclosure">
        <summary>下载靶点数据</summary>
        <div className="actions">
          <button className="small-btn" onClick={() => exportData(a, [t], "json", t.symbol)}>JSON</button>
          <button className="small-btn" onClick={() => exportData(a, [t], "csv", t.symbol)}>CSV</button>
        </div>
      </details>
      <details className="research-disclosure"><summary>相关干预物</summary>
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
            本条目记录遗传干预，见实验记录。
          </div>
        )}
      </details>
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
  const [category, setCategory] = useState("");
  const maps = new Map(a.pathwayMaps.map((m) => [m.pathwayId, m]));
  const first = ["pathway-dna", "pathway-igf", "pathway-mtor", "pathway-ecm-remodeling"];
  const entries = a.pathways.filter((p) => (!category || p.taxonomyIds.includes(category)) &&
    normalize([
      p.name +
        " " +
        p.summary +
        " " +
        p.memberIds.map((id) => entity(a, id)?.name).join(" "),
      ...maps.get(p.id)?.tracks.flatMap((t) => [t.title, ...t.nodes.flatMap((n) => [n.label, n.gene?.symbol, a.targets.find((target) => target.id === n.targetId)?.symbol])]) || [],
    ].join(" ")).includes(normalize(q)),
  ).sort((l, r) => (first.includes(l.id) ? first.indexOf(l.id) : first.length) - (first.includes(r.id) ? first.indexOf(r.id) : first.length));
  return (
    <>
      <PageHeader
        eyebrow="PATHWAY ATLAS"
        title="通路图册"
        description={`${a.pathwayMaps.length} 个通路与研究主题 · 按机制筛选，点击图中的靶点或连线查看详情。`}
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
                  pathwayMaps: a.pathwayMaps,
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
      <div className="map-catalog-filters"><div className="simple-search">
        <Search size={18} />
        <input
          aria-label="通路搜索"
          placeholder="查找通路、靶点或机制步骤"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div><select aria-label="按衰老机制筛选通路" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">全部衰老机制</option>
        {a.taxonomy.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select></div>
      <div className="pathway-grid">
        {entries.map((p) => (
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
              {p.reference ? `标准通路 · ${p.reference.database}` : "研究主题"}
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
              <Link to={`/pathways/${p.id}`} className="text-link">查看通路图 <ArrowRight size={14} /></Link> · {maps.get(p.id)?.tracks.length || 0} 个分支
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
  const [showGraph, setShowGraph] = useState(false);
  useEffect(() => setNote(id ? personal.notes[id] || "" : ""), [id]);
  if (!p) return <Empty title="通路尚未整理" />;
  const diagram = a.pathwayMaps.find((m) => m.pathwayId === p.id);
  const targets = a.targets.filter((t) => p.memberIds.includes(t.id));
  const studies = pathwayStudies(a, p.id);
  const pubs = a.publications.filter((pub) => studies.some((e) => e.publicationId === pub.id));
  const overlaps = a.pathways.filter(
    (other) =>
      other.id !== p.id &&
      other.memberIds.some((id) => p.memberIds.includes(id)),
  );
  return (
    <>
      <Link className="back-link" to="/pathways">
        <ChevronLeft size={15} />
        返回通路图册
      </Link>
      <PageHeader
        eyebrow={p.reference ? `标准通路 · ${p.reference.database}` : "研究主题"}
        title={p.name}
        description={p.summary}
      >
        <button className="outline-btn" onClick={() => toggleFavorite(p.id)}>
          <Bookmark size={15} />
          {personal.favorites.includes(p.id) ? "已收藏" : "收藏通路"}
        </button>
        <button
          className="outline-btn"
          onClick={() => download(JSON.stringify({ metadata: exportMeta(a, p.name), pathway: p, studies, publications: pubs }, null, 2), "aging-atlas-pathway-evidence.json")}
        >
          <Download size={15} />
          导出相关数据
        </button>
      </PageHeader>
      {p.reference && <a className="text-link" href={p.reference.url} target="_blank" rel="noreferrer">{p.reference.database} · {p.reference.id} <ExternalLink size={14} /></a>}
      <div className="tags roomy">
        {p.taxonomyIds.map((id) => (
          <Tag key={id}>{a.taxonomy.find((h) => h.id === id)?.name}</Tag>
        ))}
      </div>
      {diagram && <PathwayDiagram key={p.id} map={diagram} />}
      {studies.length > 0 && <section className="detail-section">
        <div className="section-heading">
          <div><h2>研究证据</h2><p>{studies.length} 条记录 · {pubs.length} 篇原始论文</p></div>
          {pubs.length > 0 && <button className="outline-btn" onClick={() => ris(pubs, a, p.name)}>导出 RIS</button>}
        </div>
        <PathwayEvidenceTable pathwayId={p.id} />
      </section>}
      <details className="research-disclosure" onToggle={(e) => setShowGraph(e.currentTarget.open)}>
        <summary>查看关系网络</summary>
        {showGraph && <Suspense fallback={<p>正在载入图谱…</p>}><Graph targetId={p.id} /></Suspense>}
      </details>
      {targets.length > 0 && <section className="detail-section">
        <h2>已收录靶点</h2>
        <div className="target-grid">
          {targets.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      </section>}
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
      {pubs.length > 0 && <details className="research-disclosure">
        <summary>论文列表（{pubs.length}）</summary>
        {pubs.map((pub) => <PubCard p={pub} key={pub.id} />)}
      </details>}
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
function MechanismDetail() {
  const { id } = useParams();
  const { atlas: a } = useAtlas();
  const h = a.taxonomy.find((h) => h.id === id);
  if (!h)
    return (
      <Empty title="该机制尚未整理">
        <Link to="/">返回分类总览</Link>
      </Empty>
    );
  const targets = a.targets.filter((t) => t.taxonomyIds.includes(h.id));
  const evidence = a.evidence.filter((e) => h.evidenceIds.includes(e.id));
  const pubs = a.publications.filter((p) =>
    evidence.some((e) => e.publicationId === p.id),
  );
  const pathways = a.pathways.filter((p) => p.taxonomyIds.includes(h.id));
  return (
    <>
      <Link className="back-link" to="/">
        <ChevronLeft size={15} />
        返回机制总览
      </Link>
      <PageHeader
        eyebrow={
          h.kind === "extension"
            ? "EXTENDED MECHANISM · 扩展机制"
            : "HALLMARK OF AGING"
        }
        title={h.name}
        description={h.summary || h.description}
      >
        <Link className="primary-btn" to={`/targets?mechanism=${h.id}`}>
          筛选关联靶点 <ArrowRight size={15} />
        </Link>
        <button
          className="outline-btn"
          onClick={() =>
            exportData(a, targets, "json", h.name + "；扩展机制主题映射")
          }
        >
          导出相关数据
        </button>
      </PageHeader>
      {h.scopeNote && <div className="boundary-note">{h.scopeNote}</div>}
      <div className="mechanism-facts">
        <span>
          <b>{targets.length}</b>关联核心靶点
        </span>
        <span>
          <b>{evidence.length}</b>相关证据记录
        </span>
        <span>
          <b>{pathways.length}</b>研究主题
        </span>
        <Tag>{h.version}</Tag>
      </div>
      <div className="mechanism-section-grid">
        {h.sections.map((s) => (
          <section className="paper-section prose" key={s.id}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
            <div className="mechanism-sources">
              {s.sourceIds.map((id) => {
                const source = a.sources.find((x) => x.id === id);
                return source ? (
                  <a
                    key={id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.name} ↗
                  </a>
                ) : null;
              })}
            </div>
          </section>
        ))}
      </div>
      <section className="detail-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">RELATED TARGETS</div>
            <h2>关联靶点与实际证据</h2>

          </div>
        </div>
        <div className="target-grid">
          {targets.map((t) => (
            <TargetCard target={t} key={t.id} />
          ))}
        </div>
      </section>
      <section className="paper-section">
        <h2>通路 / 研究主题入口</h2>
        {pathways.map((p) => (
          <Link className="pathway-chip" key={p.id} to={`/pathways/${p.id}`}>
            {p.name}
            <ArrowUpRight size={14} />
          </Link>
        ))}

      </section>
      <section className="detail-section">
        <div className="section-heading">
          <h2>ECM 研究依据与补充证据</h2>
          <button className="small-btn" onClick={() => ris(pubs, a, h.name)}>
            导出文献 RIS
          </button>
        </div>
        {evidence.map((e) => (
          <EvidenceCard e={e} key={e.id} />
        ))}
      </section>
      <section className="detail-section">
        <h2>原始研究文献</h2>
        {pubs.map((p) => (
          <PubCard p={p} key={p.id} />
        ))}
      </section>
    </>
  );
}
function Methods() {
  const { atlas: a } = useAtlas();
  return (
    <div className="research-page">
      <PageHeader eyebrow="研究目录" title="方法与数据" description={`数据 ${a.manifest.version} · 整理日期 ${a.manifest.updated}`} />
      <section className="paper-section prose">
        <h2>收录范围</h2>
        <p>网站以 <a href="https://doi.org/10.1016/j.cell.2022.11.001" target="_blank" rel="noreferrer">Cell 2023 的 12 类衰老标志</a> 为分类框架，并单列 <Link to="/mechanisms/mechanism-ecm">细胞外基质（ECM）</Link>。<Link to="/coverage">覆盖清单</Link>列出各类研究主题、已收录的靶点和后续候选。</p>
        <p>核心靶点收录人和其他哺乳动物的原始功能实验。研究主题可同时收录靶点干预、整体干预和观察关联。证据记录按模型、处理、终点和论文定位整理。</p>
        <p>通路图按标准机制、实验机制和观察研究组织。点击连线查看具体反应、模型、读出和来源。独立的关系网络同时保留主题分类和实验关系。</p>
      </section>
      <section className="paper-section prose">
        <h2>数据下载</h2>
        <p>公共数据包括文献、实验记录、实体和关系。个人收藏与笔记存储在当前浏览器，可在“收藏与笔记”导出备份。</p>
        <div className="actions">
          <a className="outline-btn" href={`${import.meta.env.BASE_URL}data/atlas.json`} download>下载公共数据 JSON</a>
          <a className="outline-btn" href={`${import.meta.env.BASE_URL}data/atlas.schema.json`} download>数据结构</a>
          <a className="outline-btn" href={`${import.meta.env.BASE_URL}data/search-log.json`} download>检索记录</a>
        </div>
      </section>
    </div>
  );
}
