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
        {children || "请调整筛选条件。当前收录范围不能代表该领域的全部研究。"}
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
      <p className="clamp3">{t.summary}</p>
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
export function PubCard({ p }: { p: Publication }) {
  const { personal, toggleFavorite, toast } = useAtlas();
  return (
    <article className="pub-card">
      <div className="eyebrow">
        {p.journal} <span>· {p.year}</span>
      </div>
      <a href={p.url} target="_blank" rel="noreferrer" className="pub-title">
        {p.title}
        <ExternalLink size={14} />
      </a>
      <p>{p.authors.join(", ")}</p>
      <div className="tags">
        <Tag>{p.accessScope}</Tag>
        <Tag>{p.metadataVerified ? "元数据已核实" : "元数据待核实"}</Tag>
        <Tag>{p.claimVerified ? "已核对提取结论" : "仅框架 / 背景"}</Tag>
      </div>
      <p className="mono">
        {p.doi && (
          <>
            DOI:{" "}
            <a
              href={`https://doi.org/${p.doi}`}
              target="_blank"
              rel="noreferrer"
            >
              {p.doi}
            </a>
            　
          </>
        )}
        {p.pmid && (
          <>
            PMID:{" "}
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`}
              target="_blank"
              rel="noreferrer"
            >
              {p.pmid}
            </a>
          </>
        )}
      </p>
      <div className="pub-foot">
        <small>
          核验：{p.checkedDate} · {p.correctionStatus}
        </small>
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
        <Tag>{e.accessScope}</Tag>
        {e.studyContext !== "aging_function" && (
          <Tag>
            {e.studyContext === "observational"
              ? "补充：观察关联"
              : "补充：非衰老模型"}
          </Tag>
        )}
      </div>
      <dl className="evidence-grid">
        {[
          ["实际实验实体", e.actualEntity],
          ["物种 / 组织细胞", `${e.species.join(" / ")} · ${e.tissueCell}`],
          ["研究模型", e.model],
          ["干预方法", e.intervention],
          ["实际结果", e.result],
          ["关键检测指标", e.endpoints.join("；")],
          ["适用条件", e.conditions],
          ["局限与外推边界", e.limitations],
          ["剂量 / 时长 / 样本量", `${e.dose} / ${e.time} / ${e.sampleSize}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="source-note">
        <b>原文定位：</b>
        {e.locator}
        <br />
        <a href={e.sourceUrl} target="_blank" rel="noreferrer">
          {p.title} ↗
        </a>{" "}
        · {p.year}
      </div>
    </article>
  );
}
