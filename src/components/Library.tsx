import { useMemo, useState } from "react";
import { ROOMS, roomMeta } from "../data";
import type { RoomId } from "../api";
import { ftitle, nFilms, pname, ROLE_HE, useLibrary, years, type LEra, type Library as Lib, type LPerson } from "../library";

const MIN = 1895, MAX = 2026;
const pos = (y: number) => ((y - MIN) / (MAX - MIN)) * 100; // 0 at the right edge: the past, as in a Hebrew line

export function Face({ p, size = 44 }: { p: LPerson; size?: number }) {
  const m = roomMeta(p.roles[0]);
  return p.img
    ? <img className="face" src={p.img.src} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size }} />
    : <span className="face blank" style={{ width: size, height: size, background: m.hue, color: m.soft }}>{pname(p).main.slice(0, 1)}</span>;
}

function EraPanel({ lib, role, era }: { lib: Lib; role: RoomId; era: LEra }) {
  const m = roomMeta(role);
  return (
    <div className="era-panel" style={{ ["--soft" as string]: m.soft, ["--hue" as string]: m.hue }}>
      <p className="mono">{m.role} — {era.from}–{era.to}</p>
      <h2>{era.title}</h2>
      <p className="era-insight"><mark>{era.insight}</mark></p>
      <p className="era-text">{era.text}</p>
      <ul className="chips">
        {era.people.map((id) => { const p = lib.people[id]; if (!p) return null; return (
          <li key={id}><a href={`#/person/${id}`} className="chip"><Face p={p} size={40} /><span><b>{pname(p).main}</b><small>{years(p)}</small></span></a></li>
        ); })}
        {era.people.length === 0 && <li className="muted">בעידן הזה אין דמות מפתח במאגר.</li>}
      </ul>
    </div>
  );
}

function Timeline({ lib }: { lib: Lib }) {
  const [sel, setSel] = useState<{ role: RoomId; id: string }>({ role: "director", id: lib.eras.director[3].id });
  const era = lib.eras[sel.role].find((e) => e.id === sel.id)!;
  const ticks = [1900, 1925, 1950, 1975, 2000];
  return (
    <div className="timeline-wrap">
      <div className="lanes" role="group" aria-label="ציר אבולוציה של ארבעת התחומים">
        <div className="axis">{ticks.map((t) => <span key={t} style={{ right: `${pos(t)}%` }}>{t}</span>)}</div>
        {ROOMS.map((r) => (
          <div key={r.id} className="lane" style={{ ["--hue" as string]: r.hue, ["--soft" as string]: r.soft }}>
            <a className="lane-name" href={`#/library/${r.id}`}>{r.role}</a>
            <div className="lane-track">
              {lib.eras[r.id].map((e, i) => (
                <button key={e.id} className={`era ${sel.id === e.id && sel.role === r.id ? "on" : ""}`}
                  style={{ right: `${pos(e.from)}%`, width: `${pos(e.to) - pos(e.from)}%`, top: i % 2 ? "52%" : "2%" }}
                  onClick={() => setSel({ role: r.id, id: e.id })} title={`${e.title} (${e.from}–${e.to})`}>
                  <span>{e.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <EraPanel lib={lib} role={sel.role} era={era} />
    </div>
  );
}

function Network({ lib }: { lib: Lib }) {
  const [sel, setSel] = useState<string | null>(null);
  const W = 1200, H = 600, band = H / 4;
  const nodes = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    ROOMS.forEach((r, bi) => {
      const list = Object.values(lib.people).filter((p) => p.roles[0] === r.id).sort((a, b) => (a.born ?? 1940) - (b.born ?? 1940));
      const taken: number[] = [];
      list.forEach((p, i) => {
        const x = W - 30 - (((p.born ?? 1940) - 1860) / (2000 - 1860)) * (W - 60);
        let row = 0; while (taken[row] !== undefined && Math.abs(taken[row] - x) < 34) row++;
        taken[row] = x;
        out[p.id] = { x, y: bi * band + 30 + (row % 4) * 20 + (i % 2) * 6 };
      });
    });
    return out;
  }, [lib]);
  const edges = lib.strong.filter((e) => nodes[e.a] && nodes[e.b]);
  const degree = useMemo(() => { const d: Record<string, number> = {}; for (const e of lib.strong) { d[e.a] = (d[e.a] || 0) + 1; d[e.b] = (d[e.b] || 0) + 1; } return d; }, [lib]);
  const active = (e: { a: string; b: string }) => sel && (e.a === sel || e.b === sel);
  const selP = sel ? lib.people[sel] : null;
  const rel = sel ? lib.strong.filter((e) => e.a === sel || e.b === sel).sort((a, b) => b.n - a.n) : [];
  return (
    <div className="net-wrap">
      <svg className="net" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מפת שיתופי פעולה בין ארבעת התחומים" onClick={() => setSel(null)}>
        {ROOMS.map((r, i) => (
          <g key={r.id}>
            <rect x="0" y={i * band} width={W} height={band} fill={r.hue} opacity="0.07" />
            <text x={W - 10} y={i * band + 22} textAnchor="start" className="band-label" fill={r.hue}>{r.role}</text>
          </g>
        ))}
        {edges.map((e, i) => {
          const A = nodes[e.a], B = nodes[e.b]; const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          return <path key={i} d={`M${A.x} ${A.y} Q${mx + (A.y < B.y ? 40 : -40)} ${my} ${B.x} ${B.y}`} fill="none"
            stroke={active(e) ? "#c8a96a" : "#2e2e2b"} strokeOpacity={sel ? (active(e) ? 0.95 : 0.03) : 0.2} strokeWidth={Math.min(1 + e.n * 0.7, 5)} />;
        })}
        {Object.values(lib.people).map((p) => {
          const n = nodes[p.id]; if (!n) return null; const m = roomMeta(p.roles[0]);
          const linked = !sel || sel === p.id || rel.some((e) => e.a === p.id || e.b === p.id);
          return (
            <g key={p.id} transform={`translate(${n.x} ${n.y})`} opacity={linked ? 1 : 0.25} style={{ cursor: "pointer" }}
              onClick={(ev) => { ev.stopPropagation(); setSel(p.id); }}>
              <circle r={sel === p.id ? 9 : 4 + Math.min(degree[p.id] || 0, 6)} fill={m.soft} stroke={m.hue} strokeWidth="1.6" />
              <title>{pname(p).main}</title>
              {((!sel && (degree[p.id] || 0) >= 4) || sel === p.id || rel.some((e) => e.a === p.id || e.b === p.id)) && <text y="-11" textAnchor="middle" className="node-label">{pname(p).main}</text>}
            </g>
          );
        })}
      </svg>
      <aside className="net-side">
        {selP ? (
          <>
            <p className="mono">{ROLE_HE[selP.roles[0]]}</p>
            <h2><a href={`#/person/${selP.id}`}>{pname(selP).main}</a></h2>
            {rel.length === 0 && <p className="muted">אין לו שיתוף פעולה בין-תחומי חוזר במאגר.</p>}
            <ul>
              {rel.map((e) => { const o = lib.people[e.a === sel ? e.b : e.a]; return (
                <li key={e.a + e.b}><a href={`#/person/${o.id}`}><b>{pname(o).main}</b> <span className="tag">{ROLE_HE[o.roles[0]]}</span></a>
                  <small>{nFilms(e.n)} משותפים: {e.films.map((f) => ftitle(lib.films[f]).main).join(", ")}</small></li>
              ); })}
            </ul>
          </>
        ) : (
          <>
            <p className="mono">איך קוראים את המפה</p>
            <p>כל נקודה היא דמות מפתח, בפס של תחומה. הציר הוא שנת הלידה: הוותיקים מימין והחדשים משמאל.</p>
            <p>קו מחבר שתי דמויות מתחומים שונים שעבדו יחד על לפחות שני סרטים בולטים. עובי הקו הוא מספר הסרטים.</p>
            <p><b>לחצו על נקודה</b> כדי לראות את שותפי היצירה שלה.</p>
            <p className="muted small">{edges.length} שיתופי פעולה חוזרים במאגר. עובי נקודה: כמה שותפים בין-תחומיים יש לדמות.</p>
          </>
        )}
      </aside>
    </div>
  );
}

export function Library() {
  const { lib, err } = useLibrary();
  const [tab, setTab] = useState<"time" | "net">("time");
  if (err) return <section className="plain"><h1>{err}</h1></section>;
  if (!lib) return <section className="plain"><p className="muted">טוען את המאגר.</p></section>;
  const n = Object.keys(lib.people).length;
  return (
    <section className="library">
      <div className="lib-head">
        <div>
          <p className="mono">הספרייה — {n} דמויות מפתח, {Object.keys(lib.films).length} סרטים</p>
          <h1>איך כל תחום התפתח, ומי עבד עם מי</h1>
        </div>
        <div className="mode light" role="tablist">
          <button role="tab" aria-selected={tab === "time"} className={tab === "time" ? "on" : ""} onClick={() => setTab("time")}>אבולוציה</button>
          <button role="tab" aria-selected={tab === "net"} className={tab === "net" ? "on" : ""} onClick={() => setTab("net")}>שיתופי פעולה</button>
        </div>
      </div>
      {tab === "time" ? <Timeline lib={lib} /> : <Network lib={lib} />}
      <p className="source small muted">מקורות: {lib.source}. עודכן {lib.generated}. העידנים הם סיכום מערכת, והעובדות על כל דמות וסרט מגיעות מהמקורות.</p>
    </section>
  );
}
