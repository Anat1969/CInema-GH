import { useMemo, useState } from "react";
import type { RoomId } from "../api";
import { roomMeta } from "../data";
import { ftitle, nFilms, pname, ROLE_HE, ROLE_PLURAL, shortAuthor, useLibrary, years, type LPerson } from "../library";
import { Face } from "./Library";

const Loading = () => <section className="plain"><p className="muted">טוען את המאגר.</p></section>;
const Missing = ({ what }: { what: string }) => <section className="plain"><h1>{what} לא נמצא במאגר</h1><a className="btn primary" href="#/library">לספרייה</a></section>;

export function FieldPage({ role }: { role: RoomId }) {
  const { lib } = useLibrary();
  const m = roomMeta(role);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    if (!lib) return [];
    const t = q.trim().toLowerCase();
    return Object.values(lib.people).filter((p) => p.roles.includes(role))
      .filter((p) => !t || (p.he + " " + p.en).toLowerCase().includes(t))
      .sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));
  }, [lib, role, q]);
  if (!lib) return <Loading />;
  const eras = lib.eras[role];
  return (
    <section className="field" style={{ ["--hue" as string]: m.hue, ["--soft" as string]: m.soft }}>
      <div className="field-head">
        <div>
          <p className="mono">הספרייה — {m.name}</p>
          <h1>{ROLE_PLURAL[role]} שעיצבו את התחום</h1>
        </div>
        <div className="row">
          <a className="btn soft" href="#/library">לתמונה הכוללת</a>
          <a className="btn primary" href={`#/room/${role}`}>לחדר {m.role}</a>
        </div>
      </div>
      <ol className="era-list">
        {eras.map((e) => (
          <li key={e.id}>
            <span className="mono">{e.from}–{e.to}</span>
            <b>{e.title}</b>
            <em><mark>{e.insight}</mark></em>
            <p>{e.text}</p>
          </li>
        ))}
      </ol>
      <div className="field-people">
        <div className="find"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש שם" aria-label="חיפוש שם" /><span className="muted small">מוצגות {list.length} דמויות, לפי שנת לידה</span></div>
        <ul className="people-grid">
          {list.map((p) => (
            <li key={p.id}><a href={`#/person/${p.id}`} className="pcard">
              <Face p={p} size={72} />
              <b>{pname(p).main}</b>
              <small>{pname(p).sub}</small>
              <small>{years(p)}</small>
            </a></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PersonPage({ id }: { id: string }) {
  const { lib } = useLibrary();
  if (!lib) return <Loading />;
  const p: LPerson | undefined = lib.people[id];
  if (!p) return <Missing what="הדמות" />;
  const m = roomMeta(p.roles[0]);
  const myEras = p.roles.flatMap((r) => lib.eras[r].filter((e) => e.people.includes(p.id)).map((e) => ({ ...e, role: r })));
  const nm = pname(p);
  return (
    <section className="person" style={{ ["--hue" as string]: m.hue, ["--soft" as string]: m.soft }}>
      <div className="person-photo">
        {p.img ? <img src={p.img.src} alt={nm.main} /> : <div className="noimg" style={{ background: m.hue, color: m.soft }}>{nm.main.slice(0, 1)}</div>}
        {p.img && <p className="credit small">תמונה: {shortAuthor(p.img.author)}, <a href={p.img.licenseUrl || p.img.page} target="_blank" rel="noreferrer">{p.img.license || "רישיון חופשי"}</a>, <a href={p.img.page} target="_blank" rel="noreferrer">מקור ב-Commons</a></p>}
      </div>
      <div className="person-main">
        <p className="mono">{p.roles.map((r) => ROLE_HE[r]).join(" ו")} · {years(p)}{p.countries.length ? " · " + p.countries.join(", ") : ""}</p>
        <h1>{nm.main}</h1>
        {nm.sub && <p className="en-name" dir="ltr">{nm.sub}</p>}
        {p.descHe && <p className="desc"><mark>{p.descHe}</mark></p>}
        {p.bioHe ? <p className="bio">{p.bioHe}</p> : p.bioEn ? <p className="bio en" dir="ltr">{p.bioEn}</p> : p.descEn ? <p className="bio en" dir="ltr">{p.descEn}</p> : null}
        <p className="small muted">
          {p.wiki.he && <a href={`https://he.wikipedia.org/wiki/${encodeURIComponent(p.wiki.he)}`} target="_blank" rel="noreferrer">ויקיפדיה בעברית</a>}
          {p.wiki.he && p.wiki.en && " · "}
          {p.wiki.en && <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(p.wiki.en)}`} target="_blank" rel="noreferrer">Wikipedia</a>}
          {" · "}<a href={`https://www.wikidata.org/wiki/${p.id}`} target="_blank" rel="noreferrer">Wikidata</a>
        </p>
        <div className="person-cols">
          <div>
            <p className="mono">סרטים בולטים ({p.nFilms} במאגר)</p>
            <ul className="flist">
              {p.films.map((x) => { const f = lib.films[x.f]; if (!f) return null; const t = ftitle(f); return (
                <li key={x.f}><a href={`#/film/${x.f}`}><b>{t.main}</b>{f.year && <small> {f.year}</small>}</a>{x.roles.map((r) => <span key={r} className="tag">{ROLE_HE[r]}</span>)}</li>
              ); })}
            </ul>
          </div>
          <div>
            <p className="mono">שותפים ליצירה</p>
            <ul className="flist">
              {(p.collab || []).slice(0, 8).map((c) => { const o = lib.people[c.id]; return (
                <li key={c.id}><a href={`#/person/${o.id}`}><Face p={o} size={30} /><b>{pname(o).main}</b></a><span className="tag">{ROLE_HE[o.roles[0]]}</span><small>{nFilms(c.n)}: {c.films.slice(0, 2).map((f) => ftitle(lib.films[f]).main).join(", ")}</small></li>
              ); })}
              {!(p.collab || []).length && <li className="muted">אין שיתופי פעולה בולטים במאגר.</li>}
            </ul>
            {myEras.length > 0 && <>
              <p className="mono eras-t">העידן</p>
              <ul className="flist">{myEras.map((e) => <li key={e.id}><a href="#/library"><b>{e.title}</b><small> {e.from}–{e.to}</small></a></li>)}</ul>
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FilmPage({ id }: { id: string }) {
  const { lib } = useLibrary();
  if (!lib) return <Loading />;
  const f = lib.films[id];
  if (!f) return <Missing what="הסרט" />;
  const t = ftitle(f);
  return (
    <section className="film">
      <p className="mono">סרט{f.year ? ` · ${f.year}` : ""}</p>
      <h1>{t.main}</h1>
      {t.sub && <p className="en-name" dir="ltr">{t.sub}</p>}
      <div className="film-roles">
        {(Object.keys(f.credits) as RoomId[]).map((r) => {
          const m = roomMeta(r);
          return (
            <div key={r} className="frole" style={{ ["--hue" as string]: m.hue, ["--soft" as string]: m.soft }}>
              <p className="mono">{ROLE_HE[r]}</p>
              <ul>
                {f.credits[r].map((c, i) => { const p = c.id ? lib.people[c.id] : null; return (
                  <li key={i}>{p ? <a href={`#/person/${p.id}`} className="chip"><Face p={p} size={40} /><b>{pname(p).main}</b></a> : <span>{c.name || "לא צוין"}</span>}</li>
                ); })}
                {f.credits[r].length === 0 && <li className="muted">לא צוין במקור</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="small muted">מקור: <a href={`https://www.wikidata.org/wiki/${f.id}`} target="_blank" rel="noreferrer">Wikidata</a></p>
    </section>
  );
}
