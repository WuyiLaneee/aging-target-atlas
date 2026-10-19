import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Atlas } from "./schema";
import { config } from "./config";
import { validateBackup } from "./lib/core.mjs";
export type Personal = {
  app: string;
  schemaVersion: number;
  favorites: string[];
  notes: Record<string, string>;
};
const empty: Personal = {
  app: config.namespace,
  schemaVersion: 1,
  favorites: [],
  notes: {},
};
const key = `${config.namespace}:personal:v1`;
let initialWarning = "";
function readPersonal(): Personal {
  try {
    const s = localStorage.getItem(key);
    return s ? validateBackup(JSON.parse(s)) : empty;
  } catch {
    initialWarning =
      "浏览器个人记录无法读取，旧数据未被覆盖。请检查存储设置或导入备份。";
    return empty;
  }
}
type State = {
  atlas: Atlas;
  personal: Personal;
  setPersonal: (p: Personal) => boolean;
  compare: string[];
  toggleCompare: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toast: (s: string) => void;
};
const Context = createContext<State | null>(null);
export function AtlasProvider({
  atlas,
  children,
}: {
  atlas: Atlas;
  children: ReactNode;
}) {
  const [personal, setRaw] = useState<Personal>(readPersonal);
  const [compare, setCompare] = useState<string[]>([]);
  const [notice, toast] = useState("");
  useEffect(() => {
    if (initialWarning) toast(initialWarning);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => toast(""), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  function setPersonal(p: Personal) {
    try {
      localStorage.setItem(key, JSON.stringify(p));
      setRaw(p);
      return true;
    } catch {
      toast("保存失败：浏览器存储不可用或已满。请先导出备份，笔记没有写入。");
      return false;
    }
  }
  function toggleFavorite(id: string) {
    setPersonal({
      ...personal,
      favorites: personal.favorites.includes(id)
        ? personal.favorites.filter((x) => x !== id)
        : [...personal.favorites, id],
    });
  }
  function toggleCompare(id: string) {
    if (compare.includes(id)) setCompare(compare.filter((x) => x !== id));
    else if (compare.length < 4) setCompare([...compare, id]);
    else toast("最多同时对比 4 个靶点，请先移除一个。");
  }
  return (
    <Context.Provider
      value={{
        atlas,
        personal,
        setPersonal,
        compare,
        toggleCompare,
        toggleFavorite,
        toast,
      }}
    >
      {children}
      {notice && (
        <div role="status" className="toast">
          {notice}
          <button aria-label="关闭提示" onClick={() => toast("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useAtlas() {
  const s = useContext(Context);
  if (!s) throw new Error("数据尚未初始化");
  return s;
}
