import { normalize } from "./core.mjs";

const plain = (value) => normalize(value).normalize("NFD").replace(/\p{M}/gu, "");
const key = (value) => plain(value).replace(/[^\p{L}\p{N}]+/gu, "");
const doiKey = (value) => plain(value).replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "").replace(/^doi\s*:\s*/, "").replace(/\.$/, "");
const pmidKey = (value) => plain(value).replace(/^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//, "").replace(/^pmid\s*:?\s*/, "").replace(/\/$/, "");

function textScore(query, primary, secondary = []) {
  const norm = plain(query);
  const nKey = key(query);
  const fields = primary.map(plain);
  if (nKey && fields.some((s) => key(s) === nKey)) return 90;
  if (fields.some((s) => s.startsWith(norm))) return 70;
  if (fields.some((s) => s.includes(norm))) return 60;
  const tokens = norm.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const main = fields.join(" ");
  if (tokens.length && tokens.every((s) => main.includes(s))) return 45;
  const all = [...fields, ...secondary.map(plain)].join(" ");
  if (all.includes(norm) || (tokens.length && tokens.every((s) => all.includes(s)))) return 20;
  return 0;
}

/** Independent entity matches; names and identifiers rank above mentions. */
export function searchAtlas(a, input) {
  const q = input.trim();
  const sorted = (items, rank, tie) => items
    .map((item) => ({ item, score: q ? rank(item) : 1 }))
    .filter(({score}) => score > 0)
    .sort((x, y) => y.score - x.score || tie(x.item, y.item))
    .map(({item}) => item);
  const taxonomy = (ids) => a.taxonomy.filter((h) => ids.includes(h.id)).flatMap((h) => [h.name, h.englishName]);
  return {
    targets: sorted(a.targets, (t) => {
      if (key(q) && key(q) === key(t.symbol)) return 120;
      return textScore(q, [t.symbol, t.name, ...t.aliases], [
        t.summary, ...taxonomy(t.taxonomyIds),
        ...a.pathways.filter((p) => t.pathwayIds.includes(p.id)).map((p) => p.name),
      ]);
    }, (x, y) => x.symbol.localeCompare(y.symbol)),
    pathways: sorted(a.pathways, (p) => {
      if (p.reference?.id && key(p.reference.id) === key(q)) return 120;
      return textScore(q, [p.name], [p.summary, ...taxonomy(p.taxonomyIds)]);
    }, (x, y) => x.name.localeCompare(y.name, "zh")),
    publications: sorted(a.publications, (p) => {
      if ((p.pmid && pmidKey(q) === p.pmid) || (p.doi && doiKey(q) === doiKey(p.doi))) return 120;
      // Do not treat a nonmatching identifier as a bag of common numeric words.
      if (/^(?:\d+|pmid\s*:?\s*\d+)$/.test(plain(q)) || /^10\.\d+\//.test(doiKey(q))) return 0;
      const evidence = a.evidence.filter((e) => e.publicationId === p.id);
      const studies = a.themeStudies.filter((e) => e.publicationId === p.id);
      const names = a.targets.filter((t) => evidence.some((e) => e.targetId === t.id)).flatMap((t) => [t.symbol, t.name, ...t.aliases]);
      return textScore(q, [p.title, ...p.authors], [p.journal, ...names, ...studies.map((e) => e.subject)]);
    }, (x, y) => y.year - x.year || x.title.localeCompare(y.title)),
  };
}
