async page => {
  const start = new URL(page.url());
  const base = start.origin + start.pathname;
  const checks = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ok = (condition, message) => {
    if (!condition) throw new Error(message);
    checks.push(message);
  };
  const go = async (route, title) => {
    await page.goto(base + "#" + route);
    await page.getByRole("heading", { level: 1, name: title }).waitFor();
  };
  const search = async (q) => {
    const input = page.getByRole("textbox", { name: "全站搜索" });
    await input.fill(q);
    await input.press("Enter");
    await page.getByRole("heading", { name: "搜索结果", exact: true }).waitFor();
    await page.waitForURL((url) => new URLSearchParams(url.hash.split("?")[1]).get("q") === q);
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/", "抗衰靶点与通路图谱");
  ok(await page.getByRole("search").count() === 1, "首页只有一个全站搜索框");
  ok(await page.locator(".taxonomy-card").count() === 12, "原12类衰老标志保持独立");
  await page.screenshot({ path: "output/playwright/v12-home.png", animations: "disabled" });
  await search("MMP1");
  ok((await page.locator("#search-targets + .result-list .result-title").first().innerText()).startsWith("MMP1"), "精确基因符号置顶");
  await search("36914001");
  ok(await page.locator(".pub-card").count() === 1 && await page.getByRole("link", { name: "开放全文" }).getAttribute("href") === "https://pmc.ncbi.nlm.nih.gov/articles/PMC11577279/", "PMID命中原始论文并提供直接全文入口");
  await page.screenshot({ path: "output/playwright/v12-paper.png", animations: "disabled" });
  await search("10.1016/j.jid.2023.02.028");
  ok(await page.locator(".pub-card").count() === 1, "DOI独立命中论文");
  await search("Garcia-Prat");
  ok(await page.getByText("Autophagy maintains stemness by preventing senescence.", { exact: true }).count() === 1, "作者名支持重音和连字符归一化");
  await search("R-HSA-1632852");
  ok(await page.getByRole("link", { name: "宏自噬与自噬调控" }).count() === 1, "Reactome编号直接命中标准通路");
  await go("/targets/target-mmp1", /MMP1/);
  ok(await page.locator(".research-feature").getByRole("link", { name: "开放全文" }).count() === 1, "靶点首屏提供原文链接");
  await page.screenshot({ path: "output/playwright/v12-target.png", animations: "disabled" });
  await go("/pathways/pathway-ecm-remodeling", "ECM 胶原稳态与重塑");
  const rows = page.locator(".pathway-evidence-row");
  ok(await rows.filter({ hasText: "组织" }).count() > 0 && await rows.locator("a[href*='19116368']").count() > 0, "ECM独立证据行显示模型和对应论文");
  ok(await page.getByRole("heading", { name: "研究证据", exact: true }).count() === 1, "通路页先显示逐条研究证据");
  await page.screenshot({ path: "output/playwright/v12-pathway.png", animations: "disabled" });
  await rows.locator("a[href*='target-mmp1?evidence=']").first().click();
  await page.getByRole("heading", { level: 1, name: /MMP1/ }).waitFor();
  ok(new URLSearchParams(new URL(page.url()).hash.split("?")[1]).has("evidence"), "通路证据可直达靶点对应实验");
  await go("/pathways/pathway-microbiota-host", "肠道微生物群与宿主衰老");
  ok(await rows.count() === 4 && await page.getByRole("heading", { name: "已收录靶点" }).count() === 0, "菌群整体干预独立于基因靶点");
  await go("/coverage", "覆盖清单");
  ok(await page.locator(".coverage-item").count() === 13, "覆盖清单含12类标志及ECM");
  await page.locator(".coverage-item").filter({ hasText: "宏自噬受损" }).locator("summary").click();
  ok(await page.getByRole("link", { name: /选择性线粒体自噬/ }).isVisible(), "清单通路可达");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, title] of [["/", "抗衰靶点与通路图谱"], ["/search?q=36914001", "搜索结果"], ["/targets/target-mmp1", /MMP1/], ["/pathways/pathway-ecm-remodeling", "ECM 胶原稳态与重塑"]]) {
    await go(route, title);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "390px无横向溢出：" + route);
  }
  await page.screenshot({ path: "output/playwright/v12-mobile.png", animations: "disabled" });
  ok(errors.length === 0, "浏览器无未捕获异常");
  return { base, status: "passed", checks };
}
