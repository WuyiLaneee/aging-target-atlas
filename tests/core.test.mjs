import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  normalize,
  csvCell,
  makeCSV,
  validateBackup,
  mergeBackup,
  selectLocalRelations,
} from "../src/lib/core.mjs";
import { validateIntegrity } from "../scripts/data-integrity.mjs";
const load = () =>
  JSON.parse(fs.readFileSync("public/data/atlas.json", "utf8"));
test("中文CSV保留引号换行，阻止公式前缀注入", () => {
  assert.equal(csvCell('=HYPERLINK("a")'), '"\'=HYPERLINK(""a"")"');
  assert.equal(csvCell("中文\n结果"), '"中文\n结果"');
  assert.equal(csvCell("\t@foo"), '"\'\t@foo"');
  assert.ok(
    makeCSV([{ 名称: "衰老" }], { scope: "当前筛选" }).startsWith("\ufeff"),
  );
});
test("Unicode 搜索归一化匹配常见连字符与希腊字母", () => {
  assert.equal(normalize(" ＭＴＯＲ "), "mtor");
  assert.equal(normalize("NF–κB"), "nf-kappab");
});
test("备份导入拒绝不匹配格式与原型污染ID", () => {
  assert.throws(() => validateBackup({ schemaVersion: 1 }));
  assert.throws(() =>
    validateBackup(
      JSON.parse(
        '{"app":"aging-target-pathway-atlas","schemaVersion":1,"favorites":[],"notes":{"__proto__":"x"}}',
      ),
    ),
  );
});
test("备份合并保留当前笔记、未知旧ID和收藏并集", () => {
  const current = {
      app: "aging-target-pathway-atlas",
      schemaVersion: 1,
      favorites: ["a"],
      notes: { a: "现有" },
    },
    incoming = {
      ...current,
      favorites: ["b"],
      notes: { a: "导入", old: "旧ID" },
    };
  const m = mergeBackup(current, incoming);
  assert.deepEqual(m.favorites, ["a", "b"]);
  assert.equal(m.notes.a, "现有");
  assert.equal(m.notes.old, "旧ID");
});
test("图谱层数、方向与规模约束可阻止全库意外展开", () => {
  const rs = [
    { id: "ab", sourceId: "a", targetId: "b" },
    { id: "bc", sourceId: "b", targetId: "c" },
    { id: "dc", sourceId: "d", targetId: "c" },
  ];
  assert.deepEqual(selectLocalRelations(rs, "a", 1).nodeIds, ["a", "b"]);
  assert.equal(selectLocalRelations(rs, "a", 2).relations.length, 2);
  assert.equal(
    selectLocalRelations(rs, "a", 1, "upstream").relations.length,
    0,
  );
  assert.equal(selectLocalRelations(rs, "b", 2, "all", 1).relations.length, 1);
});
test("全库schema与引用完整性通过", () =>
  assert.equal(validateIntegrity(load()).status, "passed"));
test("拒绝悬空端点与伪造直接结合关系", () => {
  const a = load();
  a.relations[0].targetId = "ghost";
  assert.throws(() => validateIntegrity(a), /悬空/);
  const b = load();
  b.relations[0].relationType = "binds";
  assert.throws(() => validateIntegrity(b), /直接结合/);
});
test("拒绝失去原始功能依据的核心条目", () => {
  const a = load();
  a.targets[0].evidenceIds = [];
  assert.throws(() => validateIntegrity(a), /核心缺少/);
});
test("无方向关系不会冒充上游或下游", () => {
  const rs = [
    { id: "u", sourceId: "a", targetId: "b", direction: "undirected" },
    { id: "d", sourceId: "a", targetId: "c", direction: "directed" },
  ];
  assert.deepEqual(
    selectLocalRelations(rs, "a", 1, "downstream").relations.map((r) => r.id),
    ["d"],
  );
  assert.equal(
    selectLocalRelations(rs, "b", 1, "upstream").relations.length,
    0,
  );
});
