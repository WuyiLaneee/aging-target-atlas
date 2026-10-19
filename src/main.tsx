import React, { useEffect, useState, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { loadAtlas } from "./data";
import type { Atlas } from "./schema";
import { AtlasProvider } from "./state";
import App from "./App";
import { config } from "./config";
document.title = config.name;
import "./style.css";
import "./readability.css";
class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <div className="startup">
        <h1>页面遇到错误</h1>
        <p>
          这属于程序显示错误，不代表没有科学证据。刷新前请保留未保存的笔记。
        </p>
        <pre>{this.state.error}</pre>
        <button onClick={() => location.reload()}>重新加载</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Root() {
  const [data, setData] = useState<Atlas | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    loadAtlas()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  if (error)
    return (
      <div className="startup">
        <h1>科研数据暂时无法打开</h1>
        <p>请检查站点发布路径和网络连接。这不表示没有科研证据。</p>
        <pre>{error}</pre>
        <button onClick={() => location.reload()}>重试加载</button>
      </div>
    );
  return data ? (
    <AtlasProvider atlas={data}>
      <HashRouter>
        <App />
      </HashRouter>
    </AtlasProvider>
  ) : (
    <div className="startup">
      <span className="loading" />
      <h2>正在载入研究图谱</h2>
      <p>加载分类、靶点与原始证据…</p>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <Root />
    </Boundary>
  </React.StrictMode>,
);
