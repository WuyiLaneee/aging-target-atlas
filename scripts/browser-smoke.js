async (page) => {
  const base = new URL(page.url()).origin + new URL(page.url()).pathname;
  const checks = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ok = (condition, label) => {
    if (!condition) throw Error(label);
    checks.push(label);
  };
  const go = async (route) => {
    await page.goto(base + "#" + route);
    await page.locator("main").waitFor();
  };
  const save = async (button, name) => {
    const pending = page.waitForEvent("download");
    await button.click();
    const file = await pending;
    await file.saveAs("output/playwright/" + name);
    checks.push("download:" + name);
  };
  await go("/");
  await page.evaluate(
    () => (
      localStorage.removeItem("aging-target-pathway-atlas:personal:v1"),
      sessionStorage.removeItem("aging-target-pathway-atlas:graph-prefs:v1")
    ),
  );
  await page.reload();
  await page.getByRole("heading", { name: "从 12 类机制开始探索" }).waitFor();
  ok((await page.locator(".taxonomy-card").count()) === 12, "12类导航");
  await page.getByRole("link", { name: /12 微生物群失衡/ }).click();
  await page.getByRole("heading", { name: "没有符合当前条件的条目" }).waitFor();
  ok(page.url().includes("hallmark-12"), "空状态保留筛选");
  await page
    .getByRole("button", { name: "清除全部", exact: false })
    .first()
    .click();
  await page.getByRole("textbox", { name: "目录搜索" }).fill("crat");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  ok((await page.locator(".target-card").count()) === 1, "小写符号搜索");
  await save(
    page.getByRole("button", { name: "CSV", exact: true }),
    "filtered-targets.csv",
  );
  await save(
    page.getByRole("button", { name: "JSON", exact: true }),
    "filtered-targets.json",
  );
  await page.getByRole("link", { name: "CRAT", exact: true }).click();
  await page.getByRole("heading", { name: "CRAT 肉碱乙酰转移酶" }).waitFor();
  await page.getByRole("button", { name: "收藏 CRAT", exact: true }).click();
  await page
    .getByRole("textbox", { name: "靶点笔记" })
    .fill("SMOKE：原始真皮模型与人体功效分开。");
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "取消收藏 CRAT", exact: true })
    .waitFor();
  ok(
    (
      await page.getByRole("textbox", { name: "靶点笔记" }).inputValue()
    ).includes("SMOKE"),
    "收藏与笔记刷新持久化",
  );
  await save(page.getByRole("button", { name: "导出 RIS" }), "references.ris");
  await save(page.getByRole("button", { name: "导出 PNG" }), "network.png");
  await page.getByRole("link", { name: "返回浏览位置" }).click();
  ok(page.url().includes("q=crat"), "返回恢复目录查询");
  await go("/targets");
  await page.getByRole("button", { name: "更多筛选" }).click();
  await page
    .getByLabel("物种", { exact: true })
    .selectOption("人（Homo sapiens）");
  const model = await page
    .getByLabel("研究模型", { exact: true })
    .locator("option")
    .allTextContents();
  const mouseModel = model.find((t) => t.includes("Sirt6 转基因"));
  ok(Boolean(mouseModel), "筛选存在鼠遗传模型");
  await page
    .getByLabel("研究模型", { exact: true })
    .selectOption({ label: mouseModel });
  await page.getByRole("heading", { name: "没有符合当前条件的条目" }).waitFor();
  checks.push("物种/模型同条证据匹配");
  await go("/compare");
  for (const id of [
    "target-crat",
    "target-sirt6",
    "target-cgas",
    "target-sting1",
  ]) {
    await page.getByLabel("添加对比靶点").selectOption(id);
    await page.getByRole("button", { name: "加入对比", exact: true }).click();
  }
  ok(
    (await page.locator(".compare-table thead th").count()) === 5,
    "4靶点对比表",
  );
  await page.getByLabel("添加对比靶点").selectOption("target-tert");
  await page.getByRole("button", { name: "加入对比", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "最多同时对比" }).waitFor();
  ok(
    (await page.locator(".compare-table thead th").count()) === 5,
    "对比限制4个",
  );
  await save(
    page.getByRole("button", { name: "对比 JSON" }),
    "comparison.json",
  );
  await go("/library");
  await page.getByRole("link", { name: /CRAT ·/ }).waitFor();
  await save(
    page.getByRole("button", { name: "导出备份" }),
    "personal-backup.json",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles("output/playwright/personal-backup.json");
  await page.getByRole("heading", { name: "导入前预览" }).waitFor();
  await page.getByRole("button", { name: "合并导入" }).click();
  checks.push("备份结构校验和合并预览");
  await page
    .locator("input[type=file]")
    .setInputFiles("tests/fixtures/legacy-backup.json");
  await page.getByRole("button", { name: "合并导入" }).click();
  await page
    .getByText(
      "当前版本未找到此 ID。收藏与笔记已保留，请核对迁移关系；不会静默删除。",
    )
    .waitFor();
  checks.push("旧ID笔记保留并提示");
  await page
    .locator("input[type=file]")
    .setInputFiles("tests/fixtures/invalid-backup.json");
  await page.getByRole("status").filter({ hasText: "不是有效" }).waitFor();
  checks.push("错误备份拒绝导入");
  await go("/graph?root=target-crat");
  await page.locator(".graph-canvas canvas").first().waitFor();
  await page.getByText(/可读关系列表/).click();
  await page
    .locator(".relation-row")
    .filter({ hasText: "CRAT缺失表型依赖CGAS" })
    .click();
  await page
    .locator(".graph-inspector")
    .getByRole("heading", { name: "CRAT缺失表型依赖CGAS" })
    .waitFor();
  ok(
    (await page.locator(".graph-inspector").innerText()).includes("Fig5b"),
    "连线详情显示实验定位",
  );
  await page.getByRole("button", { name: "展开第二层" }).click();
  checks.push("图谱展开/连线追溯");
  await page.getByLabel("图谱物种").selectOption("人（Homo sapiens）");
  await page.getByRole("button", { name: "图谱适应窗口" }).click();
  await page.screenshot({
    path: "output/playwright/graph-desktop.png",
    animations: "disabled",
  });
  await save(
    page.getByRole("button", { name: "关系 CSV", exact: true }),
    "relations.csv",
  );
  await go("/pathways");
  await save(page.getByRole("button", { name: "通路 CSV" }), "pathways.csv");
  await page.getByRole("link", { name: "cGAS–STING 胞质 DNA 感知" }).click();
  await page.getByRole("heading", { name: "已收录成员" }).waitFor();
  await page.getByLabel("通路笔记").fill("SMOKE：交叉节点不等于直接调控");
  await page.getByRole("button", { name: "保存笔记" }).click();
  await page.reload();
  await page.waitForFunction(() =>
    document
      .querySelector('textarea[aria-label="通路笔记"]')
      ?.value.includes("SMOKE"),
  );
  ok(
    (await page.getByLabel("通路笔记").inputValue()).includes("SMOKE"),
    "通路独立链接刷新/笔记",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/");
  await page.screenshot({
    path: "output/playwright/home-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
    "窄屏首页无全页横溢",
  );
  await page.getByRole("button", { name: "展开导航" }).click();
  await page
    .locator(".sidebar nav")
    .getByRole("link", { name: "靶点目录" })
    .click();
  ok((await page.locator(".target-card").count()) > 0, "窄屏导航与目录");
  await go("/targets/target-cgas");
  await page.getByRole("heading", { name: /CGAS 环/ }).waitFor();
  ok(
    (await page.locator("main").innerText()).includes("2026"),
    "2026相反证据可见",
  );
  await page.screenshot({
    path: "output/playwright/evidence-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
    "窄屏详情无全页横溢",
  );
  await go("/graph?root=target-crat");
  await page.locator(".graph-canvas canvas").first().waitFor();
  await page.screenshot({
    path: "output/playwright/graph-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
    "窄屏图谱无全页横溢",
  );
  await page.route("**/data/atlas.json", (r) =>
    r.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.reload();
  await page.getByRole("heading", { name: "科研数据暂时无法打开" }).waitFor();
  checks.push("加载错误与科研空结果分开");
  await page.unroute("**/data/atlas.json");
  await page.reload();
  await page.locator("main").waitFor();
  ok(errors.length === 0, "浏览器无未捕获错误：" + errors.join(";"));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/");
  return { base, status: "passed", checks };
};
