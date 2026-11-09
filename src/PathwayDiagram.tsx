import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Workflow } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAtlas } from "./state";
import { PaperLinks, Tag } from "./components";
import type { Atlas, MapTrack, PathwayMap } from "./schema";
import "./pathway-diagram.css";

const scopeLabels = { standard: "标准机制", experiment: "实验机制", observation: "观察研究" };
const nodeLabels = { target: "靶点", input: "输入 / 干预", process: "机制步骤", outcome: "读出 / 表型" };
const arrows = { activation: "促进 / 激活", inhibition: "抑制 / 降低", process: "反应或实验结果", association: "观察关联" };
const colors = { activation: "#197767", inhibition: "#a6474b", process: "#476c90", association: "#758494" };

type MapNode = MapTrack["nodes"][number];
type MapEdge = MapTrack["edges"][number];
type Ref = MapEdge["refs"][number];
type Selection = { type: "node"; node: MapNode } | { type: "edge"; edge: MapEdge };
const grid = { height: 68, row: 116, left: 85, top: 78 };
const point = (n: MapNode, pitch: number) => ({ x: grid.left + pitch * n.col, y: grid.top + grid.row * n.row });

function trace(from: MapNode, to: MapNode, pitch: number, nodeWidth: number) {
  const start = point(from, pitch), end = point(to, pitch);
  const x1 = start.x + nodeWidth / 2 + 2, x2 = end.x - nodeWidth / 2 - 4;
  const x = (x1 + x2) / 2;
  if (to.col - from.col > 1) {
    const y = 21 + Math.min(from.row, to.row) * 12;
    const a = x1 + 27, b = x2 - 27;
    return { d: `M ${x1},${start.y} C ${a},${start.y} ${a - 12},${y} ${a + 10},${y} H ${b - 10} C ${b + 12},${y} ${b},${end.y} ${x2},${end.y}`, x, y };
  }
  return { d: `M ${x1},${start.y} C ${x},${start.y} ${x},${end.y} ${x2},${end.y}`, x, y: (start.y + end.y) / 2 };
}

function Sources({ refs, atlas }: { refs: Ref[]; atlas: Atlas }) {
  const ids = new Set<string>();
  const links = new Map<string, { title: string; url: string }>();
  for (const r of refs) {
    if (typeof r !== "string") { links.set(r.url, r); continue; }
    const relation = atlas.relations.find((e) => e.id === r);
    if (!relation) { ids.add(r); continue; }
    relation.evidenceIds.forEach((id) => ids.add(id));
    relation.backgroundSourceIds.forEach((id) => {
      const s = atlas.sources.find((x) => x.id === id);
      if (s) links.set(s.url, { title: s.name, url: s.url });
    });
  }
  return <div className="map-sources">
    {[...ids].map((id) => {
      const e = atlas.evidence.find((e) => e.id === id) || atlas.themeStudies.find((e) => e.id === id);
      if (!e) return null;
      const pub = atlas.publications.find((p) => p.id === e.publicationId);
      return <article key={id} className="map-source">
        {pub && <a className="map-source-title" href={pub.url} target="_blank" rel="noreferrer">{pub.title} <ExternalLink size={13} /></a>}
        <p><b>模型：</b>{e.model} · {e.species.join(" / ")}</p>
        <p><b>处理：</b>{e.intervention}</p>
        <p><b>结果：</b>{e.result}</p>
        <p><b>原文位置：</b>{e.locator}</p>
        {pub && <PaperLinks p={pub} />}
        {"targetId" in e && <Link className="text-link" to={`/targets/${e.targetId}?evidence=${e.id}`}>查看完整实验记录 <ArrowRight size={14} /></Link>}
      </article>;
    })}
    {links.size > 0 && <ul className="map-source-links">{[...links.values()].map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title} <ExternalLink size={13} /></a></li>)}</ul>}
  </div>;
}

export function PathwayDiagram({ map }: { map: PathwayMap }) {
  const { atlas } = useAtlas();
  const uid = useId();
  const [params, setParams] = useSearchParams();
  const track = map.tracks.find((t) => t.id === params.get("diagram")) || map.tracks[0];
  const [selected, setSelected] = useState<Selection>();
  const scroll = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState(0);
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const measure = () => setViewport(el.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setSelected(undefined); scroll.current?.scrollTo({left:0}); }, [track.id]);
  const columns = Math.max(...track.nodes.map((n) => n.col));
  const pitch = viewport >= 680 ? Math.min(208, Math.max(172, Math.floor((viewport - grid.left * 2) / columns))) : 194;
  const nodeWidth = pitch < 185 ? 116 : 130;
  const width = grid.left * 2 + pitch * columns;
  const height = grid.top + 53 + grid.row * Math.max(...track.nodes.map((n) => n.row));
  const nodeMap = new Map(track.nodes.map((n) => [n.id, n]));
  const target = selected?.type === "node" ? atlas.targets.find((t) => t.id === selected.node.targetId) : undefined;
  const connected = selected?.type === "node" ? track.edges.filter((e) => [e.from, e.to].includes(selected.node.id)) : [];
  const select = (next: Selection) => {
    setSelected(next);
    requestAnimationFrame(() => {
      if (!info.current) return;
      const top = info.current.getBoundingClientRect().top;
      if (top < 80 || top > innerHeight - 125) info.current.scrollIntoView({block:"start"});
    });
  };
  return <section className="map-card" aria-labelledby={`${uid}-heading`}>
    <header className="map-header">
      <div><span className="map-kicker"><Workflow size={15} /> 机制与实验</span><h2 id={`${uid}-heading`}>通路图</h2></div>
      <p>从左向右读图。点击方框看靶点，点击连线标签看来源。</p>
    </header>
    <div className="map-tracks" role="group" aria-label="选择机制分支">
      {map.tracks.map((t) => <button type="button" key={t.id} aria-pressed={track.id === t.id} onClick={() => setParams((p) => { const next = new URLSearchParams(p); next.set("diagram", t.id); return next; }, {replace:true})}>
        <small>{scopeLabels[t.scope]}</small><span>{t.title}</span>
      </button>)}
    </div>
    <p className="map-context">{track.context}</p>
    <div className="map-scroll" ref={scroll} tabIndex={0} aria-label="通路绘图区，可横向滚动">
      <div className="map-canvas" style={{width, height}}>
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="map-arrows">
          <defs>{(["activation", "inhibition", "process"] as const).map((k) => <marker key={k} id={`${uid}-${k}`} viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse">
            {k === "inhibition" ? <path d="M9,0 V12" stroke={colors[k]} strokeWidth="2.4" /> : <path d="M0,0 L11,6 L0,12 Z" fill={colors[k]} />}
          </marker>)}</defs>
          {track.edges.map((e, i) => <path key={i} d={trace(nodeMap.get(e.from)!, nodeMap.get(e.to)!, pitch, nodeWidth).d} fill="none" stroke={colors[e.kind]} strokeWidth={selected?.type === "edge" && selected.edge === e ? 3 : 1.8} strokeDasharray={e.kind === "association" ? "4 5" : undefined} markerEnd={e.kind === "association" ? undefined : `url(#${uid}-${e.kind})`} />)}
        </svg>
        {track.nodes.map((n) => { const { x, y } = point(n, pitch); return <button type="button" key={n.id} className={`map-node map-node-${n.kind}`} style={{left:x,top:y,width:nodeWidth,minHeight:grid.height}} aria-pressed={selected?.type === "node" && selected.node.id === n.id} onClick={() => select({type:"node",node:n})}>
          <small>{nodeLabels[n.kind]}</small><span>{n.label}</span>
        </button>; })}
        {track.edges.map((e, i) => { const { x, y } = trace(nodeMap.get(e.from)!, nodeMap.get(e.to)!, pitch, nodeWidth); return <button type="button" key={i} className={`map-edge map-edge-${e.kind}`} style={{left:x,top:y,maxWidth:pitch-nodeWidth-12}} aria-label={`${nodeMap.get(e.from)!.label} 至 ${nodeMap.get(e.to)!.label}：${e.label}`} aria-pressed={selected?.type === "edge" && selected.edge === e} onClick={() => select({type:"edge",edge:e})}>{e.label}</button>; })}
      </div>
    </div>
    <p className="map-mobile-hint">左右滑动查看通路，也可展开下方列表。</p>
    <div className="map-legend" aria-label="连线图例">{Object.entries(arrows).map(([k, label]) => <span key={k} className={`map-legend-${k}`}><i aria-hidden="true">{k === "inhibition" ? "⊣" : k === "association" ? "┄" : "→"}</i>{label}</span>)}</div>
    <section className="map-inspector" ref={info} aria-live="polite" aria-label="图中选中的信息">
      {!selected && <p>选择图中的靶点或连线，查看详细信息。</p>}
      {selected?.type === "node" && <>
        <Tag>{nodeLabels[selected.node.kind]}</Tag><h3>{selected.node.label}</h3>
        {selected.node.note && <p>{selected.node.note}</p>}
        {target && <><p>{target.name} · {target.summary}</p><Link className="solid-btn" to={`/targets/${target.id}`}>查看靶点详情 <ArrowRight size={15} /></Link></>}
        {selected.node.gene && <p><b>{selected.node.gene.symbol}</b> · {selected.node.gene.name} · <a href={selected.node.gene.url} target="_blank" rel="noreferrer">基因档案 <ExternalLink size={13} /></a></p>}
        {connected.length > 0 && <div className="map-node-edges">{connected.map((e, i) => <button className="outline-btn" type="button" key={i} onClick={() => select({type:"edge",edge:e})}>{nodeMap.get(e.from)!.label} · {e.label} · {nodeMap.get(e.to)!.label}</button>)}</div>}
      </>}
      {selected?.type === "edge" && <>
        <Tag>{scopeLabels[track.scope]}</Tag>
        <h3>{nodeMap.get(selected.edge.from)!.label} · {selected.edge.label} · {nodeMap.get(selected.edge.to)!.label}</h3>
        <p>{selected.edge.detail}</p>
        <Sources refs={selected.edge.refs} atlas={atlas} />
      </>}
    </section>
    <details className="map-readable">
      <summary>用列表读图</summary>
      <ul>{track.edges.map((e, i) => <li key={i}><button type="button" className="text-link" onClick={() => select({type:"edge",edge:e})}>{nodeMap.get(e.from)!.label} · {e.label} · {nodeMap.get(e.to)!.label}</button></li>)}</ul>
    </details>
  </section>;
}
