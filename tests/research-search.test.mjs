import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { searchAtlas } from "../src/lib/search.mjs";
import { validateIntegrity } from "../scripts/data-integrity.mjs";

const load = () => JSON.parse(fs.readFileSync("public/data/atlas.json", "utf8"));

test("search separates exact gene, pathway, and publication matches", () => {
  const a = load();
  assert.equal(searchAtlas(a, "ＭＭＰ１").targets[0]?.id, "target-mmp1");
  assert.equal(searchAtlas(a, "R-HSA-1632852").pathways[0]?.id, "pathway-autophagy");
  assert.equal(searchAtlas(a, "FOXO3A").targets[0]?.id, "target-foxo3");
  assert.equal(searchAtlas(a, "CDKN1A").pathways[0]?.id, "pathway-dna");
  assert.ok(searchAtlas(a, "Garcia-Prat").publications.some((p) => p.pmid === "26738589"));
  const pub = a.publications.find((p) => p.pmid === "36914001");
  assert.equal(searchAtlas(a, pub.title).publications[0]?.id, pub.id);
  assert.deepEqual(searchAtlas(a, "PMID: 36914001").publications.map((p) => p.id), [pub.id]);
  assert.deepEqual(searchAtlas(a, "https://doi.org/10.1016/j.jid.2023.02.028").publications.map((p) => p.id), [pub.id]);
  assert.match(pub.fullTextUrl, /PMC11577279/);
});

test("diagrams reject unsourced edges and causal arrows from observation or theme membership", () => {
  const a = load();
  const dna = a.pathwayMaps.find((m) => m.pathwayId === "pathway-dna");
  const observation = a.pathwayMaps.flatMap((m) => m.tracks).find((t) => t.scope === "observation");
  assert.ok(dna.tracks[0].edges.some((e) => e.kind === "inhibition"));
  const refs = dna.tracks[0].edges[0].refs;
  dna.tracks[0].edges[0].refs = ["absent-evidence"];
  assert.throws(() => validateIntegrity(a), /通路箭头出处悬空/);
  dna.tracks[0].edges[0].refs = [a.relations.find((r) => r.relationType === "member_of").id];
  assert.throws(() => validateIntegrity(a), /主题归属不得作为图中反应/);
  dna.tracks[0].edges[0].refs = refs;
  observation.edges[0].kind = "activation";
  assert.throws(() => validateIntegrity(a), /观察图禁止因果箭头/);
});

test("theme studies do not inflate gene count and each added study has an explicit pathway", () => {
  const a = load();
  const gut = a.pathways.find((p) => p.id === "pathway-microbiota-host");
  assert.deepEqual(gut.memberIds, []);
  assert.ok(a.themeStudies.some((s) => s.pathwayId === gut.id));
  assert.equal(a.manifest.counts.coveredCategories, 12);
  const bad = structuredClone(a);
  bad.evidence.find((e) => e.targetId === "target-foxo3").pathwayIds = ["pathway-telomere"];
  assert.throws(() => validateIntegrity(bad), /通路证据靶点不匹配/);
  const badTheme = structuredClone(a);
  badTheme.themeStudies[0].publicationId = "pub-36599349";
  assert.throws(() => validateIntegrity(badTheme), /主题证据缺少原始研究/);
});
