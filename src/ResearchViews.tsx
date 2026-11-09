import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { Empty, PaperLinks, PubCard, Tag } from "./components";
import { useAtlas } from "./state";
import { searchAtlas } from "./lib/search.mjs";
import { skinLabels } from "./data";
import type { Atlas } from "./schema";

export function AtlasSearchForm({ compact = false, initial = "" }: { compact?: boolean; initial?: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  return (
    <form role="search" className={compact ? "top-search atlas-search-compact" : "atlas-search"}
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) navigate("/search?" + new URLSearchParams({ q: value.trim() })); }}>
      <Search size={compact ? 16 : 21} aria-hidden="true" />
      <input aria-label="全站搜索" placeholder={compact ? "搜索靶点、通路或论文…" : "靶点、通路、论文题名、作者、PMID 或 DOI"} value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="submit" className={compact ? "icon-btn" : "primary-btn"} aria-label="搜索">
        {compact ? <ArrowRight size={16} /> : "搜索"}
      </button>
    </form>
  );
}

const categories = [
  ["all", "全部"], ["targets", "靶点"], ["pathways", "通路"], ["publications", "论文"],
] as const;

export function SearchPage() {
  const { atlas: a } = useAtlas();
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() || "";
  const requestedKind = params.get("type");
  const kind = categories.find(([id]) => id === requestedKind)?.[0] || "all";
  const found: Pick<Atlas, "targets" | "pathways" | "publications"> = searchAtlas(a, q);
  const total = found.targets.length + found.pathways.length + found.publications.length;
  const links = (type: string) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (type !== "all") next.set("type", type);
    return "/search" + (next.size ? "?" + next.toString() : "");
  };
  const limit = kind === "all" ? 6 : undefined;
  const shown = (id: keyof typeof found) => (kind === "all" || kind === id) && found[id].length > 0;
  return (
    <div className="research-page">
      <div className="research-heading">
        <h1>{q ? "搜索结果" : kind === "publications" ? "文献索引" : "查找研究"}</h1>
        <p>{q ? `“${q}” · ${total} 项结果` : "按靶点、通路或论文查找本站研究。"} </p>
        <AtlasSearchForm key={q} initial={q} />
      </div>
      <nav className="result-tabs" aria-label="结果类型">
        {categories.map(([id, label]) => (
          <Link key={id} to={links(id)} aria-current={kind === id ? "page" : undefined}>
            {label} <b>{id === "all" ? total : found[id].length}</b>
          </Link>
        ))}
      </nav>
      {shown("targets") && <section className="result-section" aria-labelledby="search-targets">
        <h2 id="search-targets">靶点</h2>
        <div className="result-list">
          {found.targets.slice(0, limit).map((t) => {
            const es = a.evidence.filter((e) => e.targetId === t.id);
            return <article key={t.id} className="result-item">
              <Link to={`/targets/${t.id}`} className="result-title">{t.symbol} <span>{t.name}</span> <ArrowUpRight size={16} /></Link>
              <p>{skinLabels[t.skinClassification]} · {new Set(es.map((e) => e.publicationId)).size} 篇论文</p>
            </article>;
          })}
        </div>
        {kind === "all" && found.targets.length > 6 && <Link className="text-link" to={links("targets")}>查看全部靶点 →</Link>}
      </section>}
      {shown("pathways") && <section className="result-section" aria-labelledby="search-pathways">
        <h2 id="search-pathways">通路与研究主题</h2>
        <div className="result-list">
          {found.pathways.slice(0, limit).map((p) => <article key={p.id} className="result-item">
            <Link to={`/pathways/${p.id}`} className="result-title">{p.name} <ArrowUpRight size={16} /></Link>
            <p>{p.reference ? `标准通路 · ${p.reference.database}` : "研究主题"} · {p.summary}</p>
          </article>)}
        </div>
        {kind === "all" && found.pathways.length > 6 && <Link className="text-link" to={links("pathways")}>查看全部通路 →</Link>}
      </section>}
      {shown("publications") && <section className="result-section" aria-labelledby="search-papers">
        <h2 id="search-papers">论文</h2>
        {found.publications.slice(0, limit).map((p) => <PubCard key={p.id} p={p} />)}
        {kind === "all" && found.publications.length > 6 && <Link className="text-link" to={links("publications")}>查看全部论文 →</Link>}
      </section>}
      {(!total || (kind !== "all" && !shown(kind))) &&
        <Empty title="没有匹配结果">试试基因标准符号、论文题名或文献编号。</Empty>}
    </div>
  );
}

export function pathwayStudies(a: Atlas, pathwayId: string) {
  return [
    ...a.evidence.filter((e) => e.pathwayIds.includes(pathwayId)).map((e) => ({
      ...e, subject: a.targets.find((t) => t.id === e.targetId)?.symbol || e.targetId,
      targetId: e.targetId,
    })),
    ...a.themeStudies.filter((e) => e.pathwayId === pathwayId).map((e) => ({ ...e, targetId: undefined })),
  ];
}

export function PathwayEvidenceTable({ pathwayId }: { pathwayId: string }) {
  const { atlas: a } = useAtlas();
  const rows = pathwayStudies(a, pathwayId);
  if (!rows.length) return <p className="muted">当前版本暂无逐条关联的研究记录。</p>;
  return <div className="pathway-evidence">
    {rows.map((r) => {
      const p = a.publications.find((p) => p.id === r.publicationId)!;
      return <article className="pathway-evidence-row" key={r.id} id={r.id}>
        <div className="pathway-evidence-subject">
          {r.targetId ? <Link className="result-title" to={`/targets/${r.targetId}?evidence=${r.id}`}>{r.subject}</Link> : <b>{r.subject}</b>}
          <Tag>{r.studyContext === "observational" ? "观察关联" : r.studyContext === "nonaging_support" ? "补充实验" : "功能实验"}</Tag>
        </div>
        <div><span className="row-label">实验模型与处理</span><p>{r.model} · {r.species.join(" / ")}</p><p>{r.intervention}</p></div>
        <div><span className="row-label">观察到的结果</span><p>{r.result}</p></div>
        <div><span className="row-label">原始论文</span><p><a href={p.url} title={p.title} target="_blank" rel="noreferrer">{p.authors[0]} · {p.year}</a></p><p>{r.locator}</p><PaperLinks p={p} /></div>
      </article>;
    })}
  </div>;
}

export function CoveragePage() {
  const { atlas: a } = useAtlas();
  return <div className="research-page">
    <div className="research-heading">
      <h1>覆盖清单</h1>
      <p>按 12 类衰老标志及 ECM 浏览。清单列出研究主题、可查阅的证据和后续补录对象。</p>
    </div>
    <div className="coverage-list">
      {a.coveragePlan.map((entry) => {
        const h = a.taxonomy.find((h) => h.id === entry.taxonomyId)!;
        const core = a.targets.filter((t) => t.taxonomyIds.includes(h.id));
        const paths = a.pathways.filter((p) => p.taxonomyIds.includes(h.id));
        const studies = new Set(paths.flatMap((p) => pathwayStudies(a, p.id).map((e) => e.id)));
        return <details key={h.id} className="research-disclosure coverage-item">
          <summary><b>{h.name}</b><span>{core.length} 个靶点 · {studies.size} 条关联研究</span></summary>
          <div className="coverage-topics">
            {entry.topics.map((topic) => {
              const related = a.pathways.filter((p) => topic.pathwayIds.includes(p.id));
              const listed = core.filter((t) => topic.candidateSymbols.includes(t.symbol) && a.evidence.some((e) => e.targetId === t.id && e.pathwayIds.some((id) => topic.pathwayIds.includes(id))));
              const pending = topic.candidateSymbols.filter((s) => !listed.some((t) => t.symbol === s));
              const pubs = [...new Set(related.flatMap((p) => pathwayStudies(a, p.id).map((e) => e.publicationId)))];
              return <section key={topic.name} className="coverage-topic">
                <h3>{topic.name}</h3>
                <div className="coverage-links">{related.map((p) => <Link key={p.id} to={`/pathways/${p.id}`}>{p.name} ↗</Link>)}</div>
                {listed.length > 0 && <div className="coverage-links"><b>已收录</b>{listed.map((t) => <Link key={t.id} to={`/targets/${t.id}`}>{t.symbol}</Link>)}</div>}
                {pubs.length > 0 && <p>{pubs.length} 篇关联原始研究 · <Link to={`/pathways/${related[0].id}`}>查阅证据</Link></p>}
                {pending.length > 0 && <p><b>核心靶点补录候选：</b>{pending.join("、")}</p>}
                {related.length === 0 && <p className="muted">主题待整理</p>}
              </section>;
            })}
          </div>
        </details>;
      })}
    </div>
  </div>;
}
