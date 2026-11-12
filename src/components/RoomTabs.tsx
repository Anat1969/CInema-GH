import { useEffect, useMemo, useState } from "react";
import { api, type RoomId } from "../api";
import { AXES, ROOMS, roomMeta } from "../data";
import { useJourney } from "../journey";
import { ftitle, nFilms, pname, ROLE_HE, years, type Library, type LPerson } from "../library";
import { Face } from "./ui";

export type Sel = [string | null, string | null];

// ---------------------------------------------------------------- evolution
export function EvolutionTab({ lib, role }: { lib: Library; role: RoomId }) {
  const eras = lib.eras[role];
  const m = roomMeta(role);
  const others = ROOMS.filter((r) => r.id !== role);
  const pairs = useMemo(() => others.map((o) => {
    const list = lib.strong.filter((e) => {
      const a = lib.people[e.a], b = lib.people[e.b];
      return (a.roles[0] === role && b.roles[0] === o.id) || (b.roles[0] === role && a.roles[0] === o.id);
    }).sort((x, y) => y.n - x.n).slice(0, 3);
    return { room: o, list };
  }), [lib, role]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="evo">
      <p className="lead">כך התפיסה של התחום השתנתה, עידן אחר עידן. קראו את שורת ה"תפיסה" של כל דמות כדי לראות איך הרעיון התפתח.</p>
      <ol className="evo-list">
        {eras.map((e) => (
          <li key={e.id} className="era-card" style={{ ["--hue" as string]: m.hue, ["--tint" as string]: m.tint, ["--deep" as string]: m.deep }}>
            <header>
              <span className="mono">{e.from}–{e.to}</span>
              <h3>{e.title}</h3>
              <p className="era-insight"><mark>{e.insight}</mark></p>
            </header>
            <p className="era-text">{e.text}</p>
            <ul className="lens-list">
              {e.people.map((id) => { const p = lib.people[id]; if (!p) return null; return (
                <li key={id}>
                  <a href={`#/person/${id}`}><Face p={p} size={44} /></a>
                  <div>
                    <a href={`#/person/${id}`}><b>{pname(p).main}</b> <small>{years(p)}</small></a>
                    <p className="lens">{p.persp ? p.persp.lens : <span className="muted">תפיסה עוד לא נכתבה</span>}</p>
                  </div>
                </li>
              ); })}
              {e.people.length === 0 && <li className="muted">אין דמות מפתח בעידן הזה במאגר.</li>}
            </ul>
          </li>
        ))}
      </ol>
      <h3 className="sec">קשרים לחדרים האחרים</h3>
      <p className="muted small">ארבעת החדרים הם יצירה אחת. כך עבד {m.role} עם שאר התפקידים, על פי סרטים בולטים משותפים.</p>
      <div className="links-grid">
        {pairs.map(({ room, list }) => (
          <div key={room.id} className="link-card" style={{ ["--hue" as string]: room.hue, ["--tint" as string]: room.tint, ["--deep" as string]: room.deep }}>
            <p className="mono">{m.role} ו{room.role}</p>
            {list.length === 0 && <p className="muted small">אין עדיין שיתוף חוזר במאגר.</p>}
            <ul>
              {list.map((e) => { const a = lib.people[e.a], b = lib.people[e.b]; return (
                <li key={e.a + e.b}>
                  <span className="duo"><Face p={a} size={34} /><Face p={b} size={34} /></span>
                  <div>
                    <b><a href={`#/person/${a.id}`}>{pname(a).main}</a> ו<a href={`#/person/${b.id}`}>{pname(b).main}</a></b>
                    <small>{nFilms(e.n)}: {e.films.map((f) => <a key={f} href={`#/film/${f}`}>{ftitle(lib.films[f]).main}</a>).reduce<React.ReactNode[]>((acc, x, i) => (i ? [...acc, ", ", x] : [x]), [])}</small>
                  </div>
                </li>
              ); })}
            </ul>
            <a className="btn soft" href={`#/room/${room.id}/evolution`}>לחדר {room.role}</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- perspectives
function PerspCard({ p, picked, onPick }: { p: LPerson; picked: boolean; onPick: () => void }) {
  const [open, setOpen] = useState(false);
  const x = p.persp!;
  return (
    <li className={`pv ${picked ? "picked" : ""}`}>
      <div className="pv-head">
        <a href={`#/person/${p.id}`}><Face p={p} size={46} /></a>
        <div>
          <a href={`#/person/${p.id}`}><b>{pname(p).main}</b> <small>{years(p)}</small></a>
          <p className="lens">{x.lens}</p>
        </div>
      </div>
      {open && (
        <div className="pv-more">
          <p>{x.sees}</p>
          <p className="asks"><span className="tag">השאלה שלו</span>{x.asks}</p>
        </div>
      )}
      <div className="pv-actions">
        <button className="btn soft" onClick={() => setOpen((o) => !o)}>{open ? "פחות" : "מה הוא רואה"}</button>
        <button className={`btn ${picked ? "primary" : "soft"}`} onClick={onPick} aria-pressed={picked}>{picked ? "נבחר להשוואה" : "בחירה להשוואה"}</button>
      </div>
    </li>
  );
}

export function ViewsTab({ lib, role, sel, setSel }: { lib: Library; role: RoomId; sel: Sel; setSel: (s: Sel) => void }) {
  const ax = AXES[role];
  const m = roomMeta(role);
  const list = useMemo(() => Object.values(lib.people).filter((p) => p.roles[0] === role && p.persp).sort((a, b) => (a.born ?? 0) - (b.born ?? 0)), [lib, role]);
  const cols: { key: "a" | "m" | "b"; title: string }[] = [{ key: "a", title: ax.a }, { key: "m", title: ax.m }, { key: "b", title: ax.b }];
  const pick = (id: string) => {
    if (sel[0] === id) return setSel([sel[1], null]);
    if (sel[1] === id) return setSel([sel[0], null]);
    if (!sel[0]) return setSel([id, sel[1]]);
    if (!sel[1]) return setSel([sel[0], id]);
    setSel([sel[1], id]);
  };
  const A = sel[0] ? lib.people[sel[0]] : null, B = sel[1] ? lib.people[sel[1]] : null;
  return (
    <div className="views" style={{ ["--hue" as string]: m.hue, ["--tint" as string]: m.tint, ["--deep" as string]: m.deep }}>
      <p className="lead">{ax.hint} לכל דמות יש תפיסה משלה. בחרו שתיים כדי להשוות, ואז בקשו מהקולנוען תפיסה חדשה מהמפגש ביניהן.</p>
      <div className="compare">
        <div className="slot">{A ? <><Face p={A} size={40} /><span><b>{pname(A).main}</b><small>{A.persp?.lens}</small></span></> : <span className="muted">נקודת מבט ראשונה: בחרו למטה</span>}</div>
        <span className="vs mono">מול</span>
        <div className="slot">{B ? <><Face p={B} size={40} /><span><b>{pname(B).main}</b><small>{B.persp?.lens}</small></span></> : <span className="muted">נקודת מבט שנייה: בחרו למטה</span>}</div>
        <a className={`btn primary ${A && B ? "" : "off"}`} href={A && B ? `#/room/${role}/new` : undefined} aria-disabled={!(A && B)}>לתפיסה חדשה מהצירוף</a>
      </div>
      <div className="axis-cols">
        {cols.map((c) => (
          <section key={c.key} className="axcol">
            <header><span className="mono">{c.key === "m" ? "באמצע" : c.key === "a" ? "קוטב אחד" : "קוטב שני"}</span><h3>{c.title}</h3></header>
            <ul>
              {list.filter((p) => p.persp!.p === c.key).map((p) => <PerspCard key={p.id} p={p} picked={sel.includes(p.id)} onPick={() => pick(p.id)} />)}
            </ul>
          </section>
        ))}
      </div>
      <p className="small muted">נקודות המבט הן קריאה עריכתית שנשענת על התקצירים ועל רעיונות מתועדים של הדמויות. הן לא ציטוטים.</p>
    </div>
  );
}

// ---------------------------------------------------------------- frontier
interface Item { id: string; room: string; a_id: string; b_id: string; content: { name: string; claim: string; sees: string; asks: string; gap: string; try: string; a: { name: string; lens: string }; b: { name: string; lens: string } }; created_at: string }

export function NewTab({ lib, role, sel, setSel }: { lib: Library; role: RoomId; sel: Sel; setSel: (s: Sel) => void }) {
  const { profiles } = useJourney();
  const m = roomMeta(role);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fresh, setFresh] = useState<Item | null>(null);
  const A = sel[0] ? lib.people[sel[0]] : null, B = sel[1] ? lib.people[sel[1]] : null;

  useEffect(() => {
    api<{ items: Item[] }>({ action: "list", room: role }, "kolnoe-frontier").then((r) => setItems(r.items)).catch(() => undefined);
  }, [role]);

  const surprise = () => {
    const ps = Object.values(lib.people).filter((p) => p.roles[0] === role && p.persp);
    const a = ps.filter((p) => p.persp!.p === "a"), b = ps.filter((p) => p.persp!.p === "b");
    const r = (x: LPerson[]) => x[Math.floor(Math.random() * x.length)];
    setSel([r(a).id, r(b).id]);
  };
  const generate = async () => {
    if (!A?.persp || !B?.persp) return;
    setBusy(true); setErr(""); setFresh(null);
    const mk = (p: LPerson) => ({ id: p.id, name: pname(p).main, lens: p.persp!.lens, sees: p.persp!.sees, asks: p.persp!.asks });
    try {
      const r = await api<{ item: Item }>({ action: "generate", room: role, a: mk(A), b: mk(B), worldview: profiles[0]?.worldview_name || "" }, "kolnoe-frontier");
      setFresh(r.item); setItems((x) => [r.item, ...x]);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    setItems((x) => x.filter((i) => i.id !== id)); if (fresh?.id === id) setFresh(null);
    try { await api({ action: "remove", id }, "kolnoe-frontier"); } catch { /* keep UI */ }
  };

  const Card = ({ it, big }: { it: Item; big?: boolean }) => (
    <article className={`idea ${big ? "big" : ""}`} style={{ ["--hue" as string]: m.hue, ["--tint" as string]: m.tint, ["--deep" as string]: m.deep }}>
      <p className="mono">תפיסה חדשה — הצעה לחקירה</p>
      <h3><mark>{it.content.name}</mark></h3>
      <p className="claim">{it.content.claim}</p>
      <dl>
        <div><dt>מה רואה מי שמאמץ אותה</dt><dd>{it.content.sees}</dd></div>
        <div><dt>השאלה שהיא שואלת</dt><dd>{it.content.asks}</dd></div>
        <div><dt>מה היא משלימה</dt><dd>{it.content.gap}</dd></div>
        <div><dt>ניסוי לעשות היום</dt><dd>{it.content.try}</dd></div>
      </dl>
      <p className="small muted">נולדה מ: {it.content.a.name} ({it.content.a.lens}) ומ: {it.content.b.name} ({it.content.b.lens})</p>
      {!big && <button className="btn soft" onClick={() => void remove(it.id)}>הסרה</button>}
    </article>
  );

  return (
    <div className="newtab">
      <p className="lead">תפיסה חדשה נולדת מהמפגש בין שתי נקודות מבט. הקולנוען מציע, ואתם בודקים בסרט שראיתם. זו הצעה לחקירה, לא קביעה שאיש לא חשב על כך.</p>
      <div className="compare">
        <div className="slot">{A ? <><Face p={A} size={40} /><span><b>{pname(A).main}</b><small>{A.persp?.lens}</small></span></> : <span className="muted">עוד לא נבחרה נקודת מבט</span>}</div>
        <span className="vs mono">מול</span>
        <div className="slot">{B ? <><Face p={B} size={40} /><span><b>{pname(B).main}</b><small>{B.persp?.lens}</small></span></> : <span className="muted">עוד לא נבחרה נקודת מבט</span>}</div>
      </div>
      <div className="row">
        <button className="btn primary" disabled={!A || !B || busy} onClick={() => void generate()}>{busy ? "הקולנוען חושב" : "הצע תפיסה חדשה"}</button>
        <button className="btn soft" onClick={surprise} disabled={busy}>הפתיעו אותי: שני קטבים מנוגדים</button>
        <a className="btn soft" href={`#/room/${role}/views`}>לבחירה ידנית</a>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      {fresh && <Card it={fresh} big />}
      <h3 className="sec">ההצעות שלי ב{roomMeta(role).name}</h3>
      {items.length === 0 ? <p className="muted">עוד אין הצעות. בחרו שתי נקודות מבט וצרו את הראשונה.</p> : (
        <div className="ideas">{items.filter((i) => i.id !== fresh?.id).map((it) => <Card key={it.id} it={it} />)}</div>
      )}
      <p className="small muted">{ROLE_HE[role]}: ההצעות נשמרות במכשיר הזה.</p>
    </div>
  );
}
