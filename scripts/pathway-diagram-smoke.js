async page => {
  const url = new URL(page.url());
  const base = url.origin + url.pathname;
  const checks = [], errors = [], overlaps = [];
  const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  page.on("pageerror", (e) => errors.push(e.message));
  const visit = async (hash, heading) => {
    await page.goto(base + '#' + hash);
    await page.getByRole("heading", { name: heading, exact: true }).first().waitFor();
  };
  await page.setViewportSize({width:1440,height:1000});
  await page.reload();
  await visit("/pathways", "通路图册");
  const data = await page.evaluate(async () => (await fetch("data/atlas.json", {cache:"no-cache"})).json());
  assert(await page.locator(".pathway-card").count() === data.pathwayMaps.length, "目录列出所有通路图");
  await page.getByRole("combobox", {name:"按衰老机制筛选通路"}).selectOption("mechanism-ecm");
  assert(await page.getByRole("heading", {name:"Hippo–YAP/TAZ 与真皮力学应答"}).count() === 1 && await page.getByRole("heading", {name:"端粒维护与端粒酶干预"}).count() === 0, "ECM 筛选");
  await page.getByRole("combobox", {name:"按衰老机制筛选通路"}).selectOption("");
  await page.getByRole("textbox", {name:"通路搜索"}).fill("CDKN1A");
  assert(await page.getByRole("heading", {name:"DNA 损伤应答与 p53 调控"}).count() === 1, "目录可按图中基因搜索");
  await visit("/pathways/pathway-dna", "通路图");
  const figure = page.locator(".map-card");
  assert(await figure.locator(".map-node").count() === 6 && await figure.locator(".map-edge-inhibition").count() === 1, "ATM–p53–p21 图包含抑制边");
  await page.screenshot({path:"output/playwright/v13-dna.png", animations:"disabled"});
  await figure.locator(".map-node").filter({hasText:"CDKN1A"}).click();
  const inspect = page.locator(".map-inspector");
  assert((await inspect.getByRole("link", {name:"基因档案"}).getAttribute("href")).endsWith("/1026"), "通路组分打开官方基因详情");
  await figure.locator(".map-edge").filter({hasText:"Ser15"}).click();
  assert(await inspect.locator("a[href*='5693609']").count() === 1, "标准反应连线打开 Reactome 精确出处");
  await figure.locator(".map-node").filter({hasText:"TP53"}).click();
  await inspect.getByRole("link", {name:"查看靶点详情"}).click();
  assert(new URL(page.url()).hash.startsWith("#/targets/target-tp53"), "核心靶点打开本站详情");
  await visit("/pathways/pathway-dna?diagram=p16-rb", "通路图");
  assert(await figure.getByRole("button", {name:/p16–CDK4\/6–RB1/}).getAttribute("aria-pressed") === "true", "分支支持直达链接");
  await figure.getByRole("button", {name:/ATM 磷酸化 SIRT6/}).click();
  await figure.locator(".map-edge").first().click();
  assert(await inspect.getByRole("link", {name:"PubMed", exact:true}).count() > 0 && (await inspect.innerText()).includes("原文位置"), "实验连线展示模型与论文");
  await visit("/pathways/pathway-ecm-remodeling?diagram=human-age-mmp1", "通路图");
  assert(await figure.locator(".map-arrows path[stroke-dasharray]:not([marker-end])").count() === 2, "人体观察用无箭头虚线");
  await visit("/pathways/pathway-mtor", "通路图");
  await page.screenshot({path:"output/playwright/v13-mtor.png", animations:"disabled"});
  let trackCount = 0;
  for (const map of data.pathwayMaps) {
    await visit("/pathways/" + map.pathwayId, "通路图");
    for (const [i, track] of map.tracks.entries()) {
      await figure.locator(".map-tracks button").nth(i).click();
      await page.waitForFunction(({id,nodes,edges}) => new URLSearchParams(location.hash.split("?")[1]).get("diagram") === id && document.querySelectorAll(".map-node").length === nodes && document.querySelectorAll(".map-edge").length === edges, {id:track.id,nodes:track.nodes.length,edges:track.edges.length}, {timeout:3500});
      const collisions = await figure.evaluate((f) => {
        const bounds = (q) => [...f.querySelectorAll(q)].map((e) => [e.innerText, e.getBoundingClientRect()]);
        const nodes = bounds(".map-node"), edges = bounds(".map-edge");
        const hit = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left) > 4 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top) > 4;
        return edges.flatMap(([title, a], i) => [...nodes, ...edges.slice(i+1)].filter(([,b]) => hit(a,b)).map(([name]) => title + " × " + name));
      });
      if (collisions.length) overlaps.push({track:track.id, collisions});
      trackCount++;
    }
  }
  assert(trackCount === data.manifest.counts.diagramTracks, "全部分支与连线均渲染");
  await page.setViewportSize({width:390,height:844});
  await visit("/pathways/pathway-dna", "通路图");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2 && document.querySelector('.map-scroll').scrollWidth > document.querySelector('.map-scroll').clientWidth), "手机上仅绘图区横向滑动");
  await figure.getByText("用列表读图", {exact:true}).click();
  await figure.locator(".map-readable button").first().click();
  assert(await inspect.getByRole("link").count() > 0, "手机列表也可打开反应来源");
  await page.screenshot({path:"output/playwright/v13-mobile.png", animations:"disabled"});
  assert(!errors.length, "浏览器无未捕获错误");
  return {status:"passed", base, tracks:trackCount, checks, overlaps};
}
