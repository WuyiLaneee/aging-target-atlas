import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  GitCompareArrows,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { Target, Publication, Evidence } from "./schema";
import { useAtlas } from "./state";
import { skinLabels } from "./data";
import { citation } from "./lib/exports";
export function Tag({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function Empty({
  title = "没有符合当前条件的条目",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-mark">∅</div>
      <h3>{title}</h3>
      <p>
        {children || "试试其他搜索词或筛选条件。"}
      </p>
    </div>
  );
}
export function TargetActions({ t }: { t: Target }) {
  const { personal, toggleFavorite, compare, toggleCompare } = useAtlas();
  return (
    <div className="actions">
      <button
        title={personal.favorites.includes(t.id) ? "取消收藏" : "收藏靶点"}
        aria-label={`${personal.favorites.includes(t.id) ? "取消收藏" : "收藏"} ${t.symbol}`}
        className={
          personal.favorites.includes(t.id) ? "icon-btn selected" : "icon-btn"
        }
        onClick={() => toggleFavorite(t.id)}
      >
        <Bookmark
          size={17}
          fill={personal.favorites.includes(t.id) ? "currentColor" : "none"}
        />
      </button>
      <button
        className={compare.includes(t.id) ? "small-btn selected" : "small-btn"}
        onClick={() => toggleCompare(t.id)}
      >
        {compare.includes(t.id) ? (
          <Check size={14} />
        ) : (
          <GitCompareArrows size={14} />
        )}{" "}
        {compare.includes(t.id) ? "已加入" : "对比"}
      </button>
    </div>
  );
}
export function TargetCard({ target: t }: { target: Target }) {
  const { atlas: a } = useAtlas();
  const es = a.evidence.filter((e) => t.evidenceIds.includes(e.id));
  return (
    <article className="target-card">
      <div className="card-top">
        <span className="molecule-mark">{t.symbol.slice(0, 1)}</span>
        <Tag tone={t.skinClassification === "skin_aging" ? "green" : ""}>
          {skinLabels[t.skinClassification] || t.skinClassification}
        </Tag>
      </div>
      <Link to={`/targets/${t.id}`} className="target-title">
        {t.symbol}
        <ArrowUpRight size={19} />
      </Link>
      <h3>{t.name}</h3>
      <p className="clamp3">{es.find((e) => e.studyContext === "aging_function")?.claim || t.summary}</p>
      <div className="tags">
        {t.taxonomyIds.slice(0, 2).map((id) => (
          <Tag key={id}>{a.taxonomy.find((h) => h.id === id)?.name}</Tag>
        ))}
      </div>
      <div className="card-footer">
        <span>
          {es.length} 项证据 ·{" "}
          {[...new Set(es.flatMap((e) => e.species))].join(" / ")}
        </span>
        <TargetActions t={t} />
      </div>
    </article>
  );
}
export function PaperLinks({ p }: { p: Publication }) {
  return (
    <div className="paper-links">
      {p.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`} target="_blank" rel="noreferrer">PubMed <ExternalLink size={12} /></a>}
      {p.doi && <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">DOI <ExternalLink size={12} /></a>}
      {p.fullTextUrl && <a className="open-fulltext" href={p.fullTextUrl} target="_blank" rel="noreferrer">开放全文 <ExternalLink size={12} /></a>}
    </div>
  );
}
export function PubCard({ p }: { p: Publication }) {
  const { personal, toggleFavorite, toast } = useAtlas();
  return (
    <article className="pub-card">
      <div className="eyebrow">
        {p.journal} <span>· {p.year} · {p.type === "review" ? "框架综述" : "原始研究"}</span>
      </div>
      <a href={p.url} target="_blank" rel="noreferrer" className="pub-title">
        {p.title}
        <ExternalLink size={14} />
      </a>
      <p>{p.authors.slice(0, 4).join(", ")}{p.authors.length > 4 ? " 等" : ""}</p>
      <PaperLinks p={p} />
      <div className="pub-foot">
        <details className="citation-detail">
          <summary>引文信息</summary>
          <p>{p.authors.join(", ")}</p>
          <p className="mono">{[p.pmid && `PMID: ${p.pmid}`, p.doi && `DOI: ${p.doi}`].filter(Boolean).join(" · ")}</p>
          {(/勘误|更正 PMID|作者更正|更正：/.test(p.correctionStatus)) && <p>{p.correctionStatus.split("；未见")[0]}</p>}
        </details>
        <div className="actions">
          <button
            className="small-btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(citation(p));
                toast("完整引文已复制。");
              } catch {
                toast("浏览器禁止复制，请手动选择文献文字。");
              }
            }}
          >
            <Copy size={13} />
            复制引文
          </button>
          <button
            className="icon-btn"
            aria-label={`收藏文献 ${p.pmid || p.id}`}
            onClick={() => toggleFavorite(p.id)}
          >
            <Bookmark
              size={15}
              fill={personal.favorites.includes(p.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
export function EvidenceCard({ e }: { e: Evidence }) {
  const { atlas: a } = useAtlas();
  const p = a.publications.find((p) => p.id === e.publicationId)!;
  return (
    <article className="evidence-card" id={e.id}>
      <div className="section-line">
        <span className="evidence-id">{e.id}</span>
        <Tag tone="green">{e.supportStatus}</Tag>
      </div>
      <h3>{e.claim}</h3>
      <div className="tags">
        {e.evidenceType.map((x) => (
          <Tag key={x}>{x}</Tag>
        ))}
        {e.studyContext !== "aging_function" && (
          <Tag>
            {e.studyContext === "observational"
              ? "补充：观察关联"
              : "补充：非衰老模型"}
          </Tag>
        )}
      </div>
      <p className="evidence-result">{e.model} · {e.species.join(" / ")}</p>
      <p className="evidence-result">{e.result}</p>
      <details className="citation-detail evidence-more"><summary>实验条件与检测指标</summary>
      <dl className="evidence-grid">
        {[
          ["实际实验实体", e.actualEntity],
          ["物种 / 组织细胞", `${e.species.join(" / ")} · ${e.tissueCell}`],
          ["干预方法", e.intervention],
          ["关键检测指标", e.endpoints.join("；")],
          ["适用条件", e.conditions],
          ["剂量 / 时长 / 样本量", `${e.dose} / ${e.time} / ${e.sampleSize}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      </details>
      <div className="source-note">
        <b>原文定位：</b>
        {e.locator}
        <br />
        <a href={e.sourceUrl} target="_blank" rel="noreferrer">
          {p.title} ↗
        </a>{" "}
        · {p.year}
        <PaperLinks p={p} />
      </div>
    </article>
  );
}
