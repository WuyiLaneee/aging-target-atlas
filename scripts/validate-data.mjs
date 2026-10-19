import fs from "node:fs";
import { validateIntegrity } from "./data-integrity.mjs";
const data = JSON.parse(fs.readFileSync("public/data/atlas.json", "utf8"));
try {
  const result = validateIntegrity(data);
  console.log(JSON.stringify(result, null, 2));
  fs.mkdirSync("output", { recursive: true });
  fs.writeFileSync(
    "output/data-validation.json",
    JSON.stringify(result, null, 2),
  );
} catch (e) {
  console.error("科研数据校验失败：\n" + e.message);
  process.exitCode = 1;
}
