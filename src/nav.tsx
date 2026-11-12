import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface Nav { back: () => void; forward: () => void; canBack: boolean; canForward: boolean }
const Ctx = createContext<Nav>({ back: () => undefined, forward: () => undefined, canBack: false, canForward: false });
export const useNav = () => useContext(Ctx);

// Our own back/forward stack over the hash route, so "forward" is known to be available (the browser cannot tell).
export function NavProvider({ children }: { children: ReactNode }) {
  const stack = useRef<string[]>([location.hash || "#/"]);
  const idx = useRef(0);
  const skip = useRef(false);
  const [, bump] = useState(0);

  useEffect(() => {
    const h = () => {
      const cur = location.hash || "#/";
      if (skip.current) { skip.current = false; bump((n) => n + 1); return; }
      if (stack.current[idx.current] === cur) return;
      if (stack.current[idx.current - 1] === cur) idx.current -= 1;
      else if (stack.current[idx.current + 1] === cur) idx.current += 1;
      else { stack.current = [...stack.current.slice(0, idx.current + 1), cur].slice(-60); idx.current = stack.current.length - 1; }
      bump((n) => n + 1);
    };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const go = useCallback((d: -1 | 1) => {
    const n = idx.current + d;
    if (n < 0 || n >= stack.current.length) return;
    idx.current = n; skip.current = true; location.hash = stack.current[n]; bump((x) => x + 1);
  }, []);
  const value = useMemo<Nav>(() => ({
    back: () => go(-1), forward: () => go(1),
    canBack: idx.current > 0, canForward: idx.current < stack.current.length - 1,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [go, idx.current, stack.current.length]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function BackForward() {
  const { back, forward, canBack, canForward } = useNav();
  return (
    <div className="bf" role="group" aria-label="ניווט אחורה וקדימה">
      <button onClick={back} disabled={!canBack} aria-label="חזרה לדף הקודם">אחורה</button>
      <button onClick={forward} disabled={!canForward} aria-label="קדימה לדף הבא">קדימה</button>
    </div>
  );
}

export interface Crumb { label: string; href?: string }
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="איפה אני">
      {items.map((c, i) => (
        <span key={i}>{c.href ? <a href={c.href}>{c.label}</a> : <b>{c.label}</b>}{i < items.length - 1 && <i aria-hidden="true">/</i>}</span>
      ))}
    </nav>
  );
}

export interface PagerItem { label: string; sub?: string; href: string }
export function Pager({ prev, next, up }: { prev?: PagerItem | null; next?: PagerItem | null; up?: PagerItem }) {
  return (
    <div className="pager">
      {prev ? <a className="pg prev" href={prev.href}><span className="mono">הקודם</span><b>{prev.label}</b>{prev.sub && <small>{prev.sub}</small>}</a> : <span className="pg ghost" />}
      {up ? <a className="pg up" href={up.href}><span className="mono">חזרה אל</span><b>{up.label}</b></a> : <span />}
      {next ? <a className="pg next" href={next.href}><span className="mono">הבא</span><b>{next.label}</b>{next.sub && <small>{next.sub}</small>}</a> : <span className="pg ghost" />}
    </div>
  );
}
