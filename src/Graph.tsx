import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { Link, useSearchParams } from "react-router-dom";
import {
  Download,
  Maximize,
  Minus,
  Plus,
  RotateCcw,
  Network,
} from "lucide-react";
import { useAtlas } from "./state";
import { entity } from "./data";
import type { Relation } from "./schema";
import { selectLocalRelations } from "./lib/core.mjs";
import { exportRelations, download } from "./lib/exports";
import { Tag } from "./components";
import { config } from "./config";
export default function Graph({
  targetId,
  compact = false,
}: {
  targetId?: string;
  compact?: boolean;
}) {
  const { atlas: a, toast } = useAtlas();
  const [params, setParams] = useSearchParams();
  const root =
    targetId ||
    params.get("root") ||
    a.targets.find((t) => t.symbol === "CRAT")?.id ||
    a.targets[0]?.id;
  const saved = useRef<Record<string, any>>(
    (() => {
      try {
        return compact
          ? {}
          : JSON.parse(
              sessionStorage.getItem(config.namespace + ":graph-prefs:v1") ||
                "{}",
            );
      } catch {
        return {};
      }
    })(),
  );
  const [depth, setDepth] = useState<number>(Number(saved.current.depth) || 1);
  const [mode, setMode] = useState(saved.current.mode || "all");
  const [background, setBackground] = useState(
    a.pathways.some((p) => p.id === root)
      ? true
      : saved.current.background || false,
  );
  const [category, setCategory] = useState(saved.current.category || "");
  const [species, setSpecies] = useState(saved.current.species || "");
  const [model, setModel] = useState(saved.current.model || "");
  const [evidenceType, setEvidenceType] = useState(
    saved.current.evidenceType || "",
  );
  const [selection, setSelection] = useState<{
    node?: string;
    edge?: Relation;
  }>({ node: root });
  const [locate, setLocate] = useState("");
  useEffect(() => {
    if (!compact)
      try {
        sessionStorage.setItem(
          config.namespace + ":graph-prefs:v1",
          JSON.stringify({
            depth,
            mode,
            background,
            species,
            model,
            evidenceType,
            category,
          }),
        );
      } catch {}
  }, [
    depth,
    mode,
    background,
    species,
    model,
    evidenceType,
    category,
    compact,
  ]);
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const matching = a.evidence.filter(
    (e) =>
      (!species || e.species.includes(species)) &&
      (!model || e.model === model) &&
      (!evidenceType || e.evidenceType.includes(evidenceType)),
  );
  const relevant = a.relations.filter((r) =>
    r.scope === "pathway_background"
      ? background
      : r.evidenceIds.some((id) => matching.some((e) => e.id === id)),
  );
  const view = useMemo(
    () => selectLocalRelations(relevant, root, depth, mode, 40),
    [a, root, depth, mode, background, species, model, evidenceType],
  );
  const key = JSON.stringify(view);
  useEffect(() => {
    if (!host.current) return;
    const nodes: ElementDefinition[] = view.nodeIds.map((id: string) => {
      const en = entity(a, id);
      const type = a.targets.some((t) => t.id === id)
        ? "target"
        : a.pathways.some((p) => p.id === id)
          ? "pathway"
          : a.complexes.some((p) => p.id === id)
            ? "complex"
            : a.interventions.some((i) => i.id === id)
              ? "intervention"
              : "phenotype";
      return {
        data: {
          id,
          label: en ? ("symbol" in en ? en.symbol : en.name) : id,
          type,
          root: id === root ? "yes" : "no",
        },
      };
    });
    cy.current = cytoscape({
      container: host.current,
      elements: [
        ...nodes,
        ...view.relations.map((r: Relation) => ({
          data: {
            id: r.id,
            source: r.sourceId,
            target: r.targetId,
            label: r.label,
            scope: r.scope,
            kind: r.relationType,
            direction: r.direction,
          },
        })),
      ],
      layout: {
        name: "concentric",
        minNodeSpacing: compact ? 45 : 75,
        concentric: (n) => (n.id() === root ? 10 : 1),
        levelWidth: () => 1,
        padding: 45,
        animate: false,
      },
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#e6f1ed",
            "border-width": 1.8,
            "border-color": "#8db9ac",
            label: "data(label)",
            color: "#234c43",
            "font-family": "Microsoft YaHei, PingFang SC, sans-serif",
            "font-size": 12,
            "text-wrap": "wrap",
            "text-max-width": "110px",
            width: 58,
            height: 58,
            "text-valign": "center",
            "text-halign": "center",
          },
        },
        {
          selector: 'node[root="yes"]',
          style: {
            "background-color": "#177768",
            "border-color": "#105b50",
            color: "#ffffff",
            width: 76,
            height: 76,
            "font-size": 15,
            "font-weight": 700,
          },
        },
        {
          selector: 'node[type="pathway"]',
          style: {
            shape: "round-rectangle",
            "background-color": "#eef0fa",
            "border-color": "#b0b8d5",
            width: 120,
            height: 46,
            color: "#535c83",
          },
        },
        {
          selector: 'node[type="phenotype"]',
          style: {
            shape: "round-rectangle",
            "background-color": "#fff7ea",
            "border-color": "#d9bd83",
            width: 118,
            height: 48,
            color: "#805f2b",
          },
        },
        {
          selector: 'node[type="intervention"]',
          style: {
            shape: "diamond",
            "background-color": "#f8edf3",
            "border-color": "#d0a4bb",
            width: 85,
            height: 65,
          },
        },
        {
          selector: 'node[type="complex"]',
          style: {
            shape: "hexagon",
            "background-color": "#e9ecf7",
            "border-color": "#8998bd",
            width: 110,
            height: 65,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.6,
            "line-color": "#8baaa1",
            "target-arrow-color": "#718e85",
            "target-arrow-shape": "none",
            "curve-style": "bezier",
            label: "data(label)",
            "font-family": "Microsoft YaHei, sans-serif",
            "font-size": 10,
            color: "#536d65",
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.9,
            "text-background-padding": "3px",
            "text-rotation": "autorotate",
            "text-wrap": "wrap",
            "text-max-width": "90px",
          },
        },
        {
          selector: 'edge[scope="pathway_background"]',
          style: {
            "line-style": "dashed",
            "line-color": "#aab3c1",
            "target-arrow-color": "#aab3c1",
            color: "#7d8490",
          },
        },
        {
          selector: 'edge[direction="directed"]',
          style: { "target-arrow-shape": "triangle" },
        },
        {
          selector: 'edge[kind="inhibits"]',
          style: {
            "target-arrow-shape": "tee",
            "line-color": "#bc8c8c",
            "target-arrow-color": "#bc8c8c",
          },
        },
        {
          selector: ":selected",
          style: {
            "border-width": 3,
            "border-color": "#c49a45",
            "line-color": "#bd984a",
            "target-arrow-color": "#bd984a",
          },
        },
      ],
      minZoom: 0.25,
      maxZoom: 3,
    });
    cy.current.on("tap", "node", (e) => setSelection({ node: e.target.id() }));
    cy.current.on("tap", "edge", (e) =>
      setSelection({
        edge: view.relations.find((r: Relation) => r.id === e.target.id()),
      }),
    );
    const resize = new ResizeObserver(() => {
      cy.current?.resize();
    });
    resize.observe(host.current);
    setSelection({ node: root });
    return () => {
      resize.disconnect();
      cy.current?.destroy();
      cy.current = null;
    };
  }, [key, root, compact]);
  function changeRoot(id: string) {
    setDepth(1);
    setParams((p) => {
      p.set("root", id);
      return p;
    });
  }
  async function png() {
    try {
      const instance = cy.current;
      if (!instance) return;
      await document.fonts.ready;
      const dataUrl = instance.png({
        full: true,
        scale: 3,
        bg: "#ffffff",
        maxWidth: 2800,
        maxHeight: 2000,
      });
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.createElement("canvas");
      const width = Math.max(1800, img.width);
      const header = 210;
      const selectedPubs = a.publications.filter((p) =>
        view.relations.some((r: Relation) =>
          r.evidenceIds.some(
            (id) => a.evidence.find((e) => e.id === id)?.publicationId === p.id,
          ),
        ),
      );
      const lines = [
        `范围：${species || "全部物种"} · ${model || "全部模型"} · ${evidenceType || "全部证据类型"} · ${depth} 层 · ${background ? "含背景关系" : "仅功能实验关系"}`,
        `关系：${view.relations.length} 条 / 最多 40 条；跨论文的相邻关系仅为跨研究关联路径。`,
        `图例：→ 激活 / 调控　⊣ 抑制　无箭头 实验关联或归属　实线 衰老实验　虚线 机制背景`,
        `实体：圆形 基因/蛋白　圆角矩形 通路/表型　菱形 干预物；节点大小不表示效力。`,
        ...selectedPubs.map(
          (p) => `来源：${p.title} (${p.year}) · ${p.doi || "PMID " + p.pmid}`,
        ),
      ];
      const lineHeight = 36;
      canvas.width = width;
      canvas.height = header + img.height + lines.length * lineHeight + 80;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#163e35";
      ctx.font = 'bold 42px "Microsoft YaHei",sans-serif';
      ctx.fillText(
        config.name + " · " + (entity(a, root)?.name || root),
        50,
        72,
      );
      ctx.font = '27px "Microsoft YaHei",sans-serif';
      ctx.fillText(
        `数据 ${a.manifest.version} · ${a.manifest.updated} · 导出 ${new Date().toISOString()}`,
        50,
        125,
      );
      ctx.drawImage(img, (width - img.width) / 2, header);
      ctx.font = '23px "Microsoft YaHei",sans-serif';
      lines.forEach((line, i) =>
        ctx.fillText(
          line,
          50,
          header + img.height + 48 + i * lineHeight,
          width - 100,
        ),
      );
      canvas.toBlob((blob) => {
        if (blob) {
          download(blob, "aging-atlas-network.png", "image/png");
          toast("已导出高分辨率 PNG，标题、图例、筛选与来源已合成。");
        }
      }, "image/png");
    } catch (e) {
      toast("图片导出失败：" + (e instanceof Error ? e.message : String(e)));
    }
  }
  const selected = selection.node ? entity(a, selection.node) : undefined;
  const edge = selection.edge;
  const edgeEs = edge
    ? a.evidence.filter(
        (e) =>
          edge.evidenceIds.includes(e.id) &&
          matching.some((m) => m.id === e.id),
      )
    : [];
  return (
    <div className={`graph-module ${compact ? "compact" : ""}`}>
      <aside className="graph-filter-panel">
        {!compact && (
          <div className="graph-filter-title">
            探索范围 <span>FILTERS</span>
          </div>
        )}
        {!targetId && (
          <label className="graph-category">
            分类定位中心
            <select
              aria-label="图谱分类定位"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const t = a.targets.find((t) =>
                  t.taxonomyIds.includes(e.target.value),
                );
                if (t) changeRoot(t.id);
                else {
                  setCategory("");
                  toast("该分类尚未完成条目整理，继续显示当前中心。");
                }
              }}
            >
              <option value="">全部机制</option>
              {a.taxonomy.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {h.kind === "extension" ? " · 扩展机制" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="graph-toolbar">
          {!targetId && (
            <label>
              中心节点
              <select
                aria-label="图谱中心节点"
                value={root}
                onChange={(e) => changeRoot(e.target.value)}
              >
                {a.targets
                  .filter(
                    (t) =>
                      !category ||
                      t.taxonomyIds.includes(category) ||
                      t.id === root,
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.symbol} · {t.name}
                    </option>
                  ))}
                {a.pathways.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            关系方向
            <select
              aria-label="关系方向"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="all">全部相邻关系</option>
              <option value="upstream">上游 / 输入</option>
              <option value="downstream">下游 / 输出</option>
              <option value="pathway">通路归属</option>
            </select>
          </label>
          <label>
            物种
            <select
              aria-label="图谱物种"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              <option value="">全部物种</option>
              {[...new Set(a.evidence.flatMap((e) => e.species))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button
            className="small-btn"
            onClick={() => setDepth((d) => (d === 1 ? 2 : 1))}
          >
            {depth === 1 ? <Plus size={14} /> : <Minus size={14} />}{" "}
            {depth === 1 ? "展开第二层" : "收起第二层"}
          </button>
          <label className="check-label">
            <input
              type="checkbox"
              checked={background}
              onChange={(e) => setBackground(e.target.checked)}
            />
            显示机制背景
          </label>
        </div>
        {!compact && (
          <div className="graph-toolbar secondary">
            <label>
              模型
              <select
                aria-label="图谱模型"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="">全部模型</option>
                {[...new Set(a.evidence.map((e) => e.model))].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              证据类型
              <select
                aria-label="图谱证据类型"
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
              >
                <option value="">全部类型</option>
                {[...new Set(a.evidence.flatMap((e) => e.evidenceType))].map(
                  (m) => (
                    <option key={m}>{m}</option>
                  ),
                )}
              </select>
            </label>
            <input
              aria-label="图谱节点定位"
              value={locate}
              onChange={(e) => setLocate(e.target.value)}
              placeholder="定位当前图中节点"
            />
            <button
              className="small-btn"
              onClick={() => {
                const n = cy.current
                  ?.nodes()
                  .filter((n) =>
                    String(n.data("label"))
                      .toLowerCase()
                      .includes(locate.toLowerCase()),
                  );
                if (locate && n?.length) {
                  cy.current?.center(n);
                  n.select();
                  setSelection({ node: n[0].id() });
                } else toast("当前局部图中未找到该节点，可切换中心节点。");
              }}
            >
              定位
            </button>
          </div>
        )}
      </aside>
      <div className="graph-body">
        <div className="graph-canvas-wrap">
          <div
            ref={host}
            className="graph-canvas"
            role="img"
            aria-label="可交互局部关系图，拖动节点和背景，滚轮缩放。下方提供同内容关系列表。"
          />
          <div className="graph-controls">
            <button
              title="放大"
              aria-label="放大图谱"
              onClick={() => cy.current?.zoom((cy.current?.zoom() || 1) * 1.2)}
            >
              <Plus size={16} />
            </button>
            <button
              title="缩小"
              aria-label="缩小图谱"
              onClick={() => cy.current?.zoom((cy.current?.zoom() || 1) / 1.2)}
            >
              <Minus size={16} />
            </button>
            <button
              title="适应窗口"
              aria-label="图谱适应窗口"
              onClick={() => cy.current?.fit(undefined, 45)}
            >
              <Maximize size={16} />
            </button>
            <button
              title="复位布局"
              aria-label="复位图谱布局"
              onClick={() =>
                cy.current
                  ?.layout({ name: "concentric", animate: false, padding: 45 })
                  .run()
              }
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="graph-stamp">
            LOCAL NETWORK{" "}
            <span>
              {" "}
              / {view.nodeIds.length} NODES · {view.relations.length} EDGES
            </span>
          </div>
        </div>
        <aside className="graph-inspector">
          <div className="eyebrow">
            <Network size={13} /> {edge ? "关系依据" : "节点信息"}
          </div>
          {edge ? (
            <>
              <h3>{edge.label}</h3>
              <p>
                {entity(a, edge.sourceId)?.name}{" "}
                {edge.direction === "directed" ? "→" : "—"}{" "}
                {entity(a, edge.targetId)?.name}
              </p>
              <Tag tone={edge.scope === "aging_experiment" ? "green" : ""}>
                {edge.scope === "aging_experiment"
                  ? "衰老功能实验关系"
                  : "通路机制背景"}
              </Tag>
              <p>{edge.context}</p>
              <small>
                直接性：{edge.directness} · 极性：{edge.polarity}
              </small>
              {edgeEs.map((e) => (
                <div key={e.id} className="inspector-evidence">
                  <b>{e.model}</b>
                  <p>{e.result}</p>
                  <p>{e.conditions}</p>
                  <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                    {
                      a.publications.find((p) => p.id === e.publicationId)
                        ?.title
                    }{" "}
                    ↗
                  </a>
                </div>
              ))}
              {edge.backgroundSourceIds.map((id) => {
                const s = a.sources.find((s) => s.id === id);
                return s ? (
                  <p key={id}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.name} ↗
                    </a>
                  </p>
                ) : null;
              })}
            </>
          ) : selected ? (
            <>
              <h3>{"symbol" in selected ? selected.symbol : selected.name}</h3>
              <p>{selected.name}</p>
              <p>
                {"summary" in selected
                  ? selected.summary
                  : "definition" in selected
                    ? selected.definition
                    : "identity" in selected
                      ? selected.identity
                      : ""}
              </p>
              {a.targets.some((t) => t.id === selected.id) && (
                <Link className="text-link" to={`/targets/${selected.id}`}>
                  查看完整靶点证据 ↗
                </Link>
              )}
              {a.pathways.some((t) => t.id === selected.id) && (
                <Link className="text-link" to={`/pathways/${selected.id}`}>
                  查看通路详情 ↗
                </Link>
              )}
              <p className="muted">
                点击连线查看实验条件与原始文献。筛选后的详情只显示匹配证据。
              </p>
            </>
          ) : (
            <p>请选择节点或连线。</p>
          )}
        </aside>
      </div>
      <div className="graph-legend">
        <span>○ 基因 / 蛋白</span>
        <span>▭ 通路 / 表型</span>
        <span>◇ 干预物</span>
        <span>⬡ 复合物</span>
        <span>→ 激活 / 调控</span>
        <span>⊣ 抑制</span>
        <span>— 实验关联</span>
        <span>┄ 机制背景</span>
        <span>无箭头：方向未作因果断言</span>
      </div>
      <div className="section-line graph-bottom">
        <small>
          {depth === 2
            ? "第二层可能拼接不同研究，仅供追溯，不证明完整因果顺序。"
            : "默认一层关系；节点大小不表示抗衰效果。"}{" "}
          最多 40 条边。
        </small>
        <div className="actions">
          <button
            className="small-btn"
            onClick={() =>
              exportRelations(
                a,
                view.relations,
                `中心=${root}; 物种=${species}; 模型=${model}; 证据=${evidenceType}; 背景=${background}; 层数=${depth}`,
              )
            }
          >
            关系 CSV
          </button>
          <button className="small-btn" onClick={png}>
            <Download size={14} />
            导出 PNG
          </button>
        </div>
      </div>
      <details className="relations-list">
        <summary>可读关系列表（{view.relations.length}）</summary>
        {view.relations.length ? (
          view.relations.map((r: Relation) => (
            <button
              className="relation-row"
              key={r.id}
              onClick={() => setSelection({ edge: r })}
            >
              <b>{entity(a, r.sourceId)?.name}</b>
              <span>
                {r.label} {r.direction === "directed" ? "→" : "—"}
              </span>
              <b>{entity(a, r.targetId)?.name}</b>
              <Tag>
                {r.scope === "aging_experiment" ? "功能实验" : "机制背景"}
              </Tag>
            </button>
          ))
        ) : (
          <p>
            当前中心与筛选条件下尚无已整理连线。可开启机制背景、调整方向或清除模型筛选。
          </p>
        )}
      </details>
    </div>
  );
}
