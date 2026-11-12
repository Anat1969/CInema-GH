import { useMemo } from "react";
import type { RoomId } from "../api";
import { AXES, roomMeta, searchUrl } from "../data";
import { Crumbs, Pager, useNav } from "../nav";
import { ftitle, nFilms, pname, ROLE_HE, shortAuthor, useLibrary, years, type LFilm, type LPerson } from "../library";
import { Face, Framed } from "./ui";

const Loading = () => <section className="plain"><p className="muted">טוען את המאגר.</p></section>;
const Missing = ({ what }: { what: string }) => <section className="plain"><h1>{what} לא נמצא במאגר</h1><a className="btn primary" href="#/library">לספרייה</a></section>;

function LinkRow({ children }: { children: React.ReactNode }) {
  return <div className="linkrow">{children}</div>;
}
const Ext = ({ href, children, hint }: { href: string; children: React.ReactNode; hint?: string }) => (
  <a className="btn soft" href={href} target="_blank" rel="noreferrer" title={hint}>{children}</a>
);

export function filmLinks(f: LFilm) {
  const t = f.en || f.he;
  return { trailer: searchUrl(`${t} ${f.year ?? ""} official trailer`.trim()), score: searchUrl(`${t} ${f.year ?? ""} original score main theme`.trim()) };
}

export function PersonPage({ id }: { id: string }) {
  const { lib } = useLibrary();
  const nav = useNav();
  const role = lib?.people[id]?.roles[0];
  const sameRole = useMemo(() => (lib && role ? Object.values(lib.people).filter((p) => p.roles[0] === role).sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999)) : []), [lib, role]);
  if (!lib) return <Loading />;
  const p: LPerson | undefined = lib.people[id];
  if (!p) return <Missing what="הדמות" />;
  const m = roomMeta(p.roles[0]);
  const ax = AXES[p.roles[0]];
  const myEras = p.roles.flatMap((r) => lib.eras[r].filter((e) => e.people.includes(p.id)).map((e) => ({ ...e, role: r })));
  const nm = pname(p);
  const k = sameRole.findIndex((x) => x.id === id);
  const prev = k > 0 ? sameRole[k - 1] : null, next = k >= 0 && k < sameRole.length - 1 ? sameRole[k + 1] : null;
  const pole = p.persp ? (p.persp.p === "a" ? ax.a : p.persp.p === "b" ? ax.b : ax.m) : "";
  const isMusic = p.roles.includes("musician");
  const topFilm = p.films.map((x) => lib.films[x.f]).find(Boolean);
  return (
    <section className="person" style={{ ["--hue" as string]: m.hue, ["--soft" as string]: m.soft, ["--tint" as string]: m.tint, ["--deep" as string]: m.deep }}>
      <div className="person-head">
        <Crumbs items={[{ label: "בית", href: "#/" }, { label: "הספרייה", href: "#/library" }, { label: ROLE_HE[p.roles[0]], href: `#/room/${p.roles[0]}/views` }, { label: nm.main }]} />
        <button className="btn soft backbtn" onClick={nav.back} disabled={!nav.canBack}>חזרה למקום שבאתי ממנו</button>
      </div>
      <div className="person-grid">
        <div className="person-photo">
          {p.img ? <Framed src={p.img.src} alt={nm.main} caption={<span className="credit small">תמונה: {shortAuthor(p.img.author)}, <a href={p.img.licenseUrl || p.img.page} target="_blank" rel="noreferrer">{p.img.license || "רישיון חופשי"}</a>, <a href={p.img.page} target="_blank" rel="noreferrer">מקור</a></span>} />
            : <div className="mat"><div className="noimg" style={{ background: m.tint, color: m.deep }}>{nm.main.slice(0, 1)}</div></div>}
          <LinkRow>
            {p.imdb && <Ext href={`https://www.imdb.com/name/${p.imdb}/`}>IMDb</Ext>}
            {p.wiki.he && <Ext href={`https://he.wikipedia.org/wiki/${encodeURIComponent(p.wiki.he)}`}>ויקיפדיה בעברית</Ext>}
            {p.wiki.en && <Ext href={`https://en.wikipedia.org/wiki/${encodeURIComponent(p.wiki.en)}`}>Wikipedia</Ext>}
            {isMusic && <Ext href={searchUrl(`${p.en} best film scores`)} hint="חיפוש ביוטיוב">האזנה: יצירות לקולנוע</Ext>}
            {isMusic && p.mb && <Ext href={`https://musicbrainz.org/artist/${p.mb}`}>MusicBrainz</Ext>}
            {!isMusic && <Ext href={searchUrl(`${p.en} interview cinema`)} hint="חיפוש ביוטיוב">ראיונות ודברי הדמות</Ext>}
          </LinkRow>
        </div>
        <div className="person-main">
          <p className="mono">{p.roles.map((r) => ROLE_HE[r]).join(" ו")} · {years(p)}{p.countries.length ? " · " + p.countries.join(", ") : ""}</p>
          <h1>{nm.main}</h1>
          {nm.sub && <p className="en-name" dir="ltr">{nm.sub}</p>}
          {p.descHe && <p className="desc">{p.descHe}</p>}

          <div className="worldview-card">
            <p className="mono">תפיסת העולם</p>
            {p.persp ? (
              <>
                <h2><mark>{p.persp.lens}</mark></h2>
                <p className="wv-sees">{p.persp.sees}</p>
                <p className="wv-asks"><span className="tag">השאלה שהוא שואל</span>{p.persp.asks}</p>
                <p className="wv-pole small"><span className="tag">על ציר התחום</span>{pole}</p>
                <p className="small muted">קריאה עריכתית שנשענת על תקציר ועל רעיונות מתועדים. לא ציטוט.</p>
              </>
            ) : <p className="muted">תפיסת העולם של הדמות הזאת עוד לא נכתבה.</p>}
            <a className="btn soft" href={`#/room/${p.roles[0]}/views`}>להשוות לנקודות מבט אחרות</a>
          </div>

          {p.bioHe ? <p className="bio">{p.bioHe}</p> : p.bioEn ? <p className="bio en" dir="ltr">{p.bioEn}</p> : null}

          <div className="person-cols">
            <div>
              <p className="mono">סרטים בולטים ({p.nFilms} במאגר)</p>
              <ul className="filmlist">
                {p.films.map((x) => { const f = lib.films[x.f]; if (!f) return null; const t = ftitle(f); const L = filmLinks(f); return (
                  <li key={x.f}>
                    <a className="fthumb" href={`#/film/${x.f}`} aria-label={t.main}>{f.img ? <img src={f.img.src} alt="" loading="lazy" /> : <span>{t.main.slice(0, 1)}</span>}</a>
                    <div>
                      <a href={`#/film/${x.f}`}><b>{t.main}</b>{f.year && <small> {f.year}</small>}</a>
                      <div className="tags">{x.roles.map((r) => <span key={r} className="tag">{ROLE_HE[r]}</span>)}</div>
                      <div className="mini-links">
                        <a href={L.trailer} target="_blank" rel="noreferrer">טריילר</a>
                        {isMusic && <a href={L.score} target="_blank" rel="noreferrer">האזנה</a>}
                        {f.imdb && <a href={`https://www.imdb.com/title/${f.imdb}/`} target="_blank" rel="noreferrer">IMDb</a>}
                      </div>
                    </div>
                  </li>
                ); })}
              </ul>
            </div>
            <div>
              <p className="mono">שותפים ליצירה</p>
              <ul className="flist">
                {(p.collab || []).slice(0, 8).map((c) => { const o = lib.people[c.id]; return (
                  <li key={c.id}>
                    <a href={`#/person/${o.id}`}><Face p={o} size={34} /><b>{pname(o).main}</b></a><span className="tag">{ROLE_HE[o.roles[0]]}</span>
                    <small>{nFilms(c.n)}: {c.films.slice(0, 2).map((f) => ftitle(lib.films[f]).main).join(", ")}</small>
                  </li>
                ); })}
                {!(p.collab || []).length && <li className="muted">אין שיתופי פעולה בולטים במאגר.</li>}
              </ul>
              {myEras.length > 0 && <>
                <p className="mono eras-t">העידן</p>
                <ul className="flist">{myEras.map((e) => <li key={e.id}><a href={`#/room/${e.role}/evolution`}><b>{e.title}</b><small> {e.from}–{e.to}</small></a></li>)}</ul>
              </>}
              {isMusic && topFilm && <>
                <p className="mono eras-t">להאזנה</p>
                <LinkRow><Ext href={filmLinks(topFilm).score} hint="חיפוש ביוטיוב">{ftitle(topFilm).main}: הפרטיטורה</Ext></LinkRow>
              </>}
            </div>
          </div>
        </div>
      </div>
      <Pager
        prev={prev ? { label: pname(prev).main, sub: years(prev), href: `#/person/${prev.id}` } : null}
        next={next ? { label: pname(next).main, sub: years(next), href: `#/person/${next.id}` } : null}
        up={{ label: `נקודות המבט של ${m.role}`, href: `#/room/${p.roles[0]}/views` }}
      />
    </section>
  );
}

export function FilmPage({ id }: { id: string }) {
  const { lib } = useLibrary();
  const nav = useNav();
  if (!lib) return <Loading />;
  const f = lib.films[id];
  if (!f) return <Missing what="הסרט" />;
  const t = ftitle(f);
  const L = filmLinks(f);
  const wiki = f.wiki.he ? `https://he.wikipedia.org/wiki/${encodeURIComponent(f.wiki.he)}` : f.wiki.en ? `https://en.wikipedia.org/wiki/${encodeURIComponent(f.wiki.en)}` : "";
  const composer = f.credits.musician.find((c) => c.name)?.en;
  return (
    <section className="film">
      <div className="person-head">
        <Crumbs items={[{ label: "בית", href: "#/" }, { label: "הספרייה", href: "#/library" }, { label: "סרט" }, { label: t.main }]} />
        <button className="btn soft backbtn" onClick={nav.back} disabled={!nav.canBack}>חזרה למקום שבאתי ממנו</button>
      </div>
      <div className="film-grid">
        <div>
          {f.img ? <Framed ratio="3 / 2" src={f.img.src} alt={t.main} caption={<span className="credit small">תמונה: {shortAuthor(f.img.author)}, <a href={f.img.licenseUrl || f.img.page} target="_blank" rel="noreferrer">{f.img.license || "רישיון חופשי"}</a>, <a href={f.img.page} target="_blank" rel="noreferrer">מקור</a></span>} />
            : <div className="mat"><div className="noimg wide"><span>{f.year ?? ""}</span><small>אין תמונה חופשית לסרט הזה</small></div></div>}
        </div>
        <div className="film-main">
          <p className="mono">סרט{f.year ? ` · ${f.year}` : ""}</p>
          <h1>{t.main}</h1>
          {t.sub && <p className="en-name" dir="ltr">{t.sub}</p>}
          <LinkRow>
            <Ext href={L.trailer} hint="חיפוש ביוטיוב">צפייה: טריילר</Ext>
            <Ext href={searchUrl(`${f.en || f.he} ${f.year ?? ""} original score ${composer ?? ""}`.trim())} hint="חיפוש ביוטיוב">האזנה: הפרטיטורה</Ext>
            {f.imdb && <Ext href={`https://www.imdb.com/title/${f.imdb}/`}>IMDb</Ext>}
            {wiki && <Ext href={wiki}>ויקיפדיה</Ext>}
            <Ext href={`https://www.wikidata.org/wiki/${f.id}`}>Wikidata</Ext>
          </LinkRow>
          <p className="small muted">קישורי הצפייה וההאזנה הם חיפוש ביוטיוב, כי הזכויות על הסרטים והמוזיקה אינן חופשיות.</p>
          <div className="film-roles">
            {(Object.keys(f.credits) as RoomId[]).map((r) => {
              const m = roomMeta(r);
              return (
                <div key={r} className="frole" style={{ ["--hue" as string]: m.hue, ["--tint" as string]: m.tint, ["--deep" as string]: m.deep }}>
                  <p className="mono">{ROLE_HE[r]}</p>
                  <ul>
                    {f.credits[r].map((c, i) => { const p = c.id ? lib.people[c.id] : null; return (
                      <li key={i}>{p ? <a href={`#/person/${p.id}`} className="chip"><Face p={p} size={36} /><span><b>{pname(p).main}</b>{p.persp && <small>{p.persp.lens}</small>}</span></a> : <span>{c.name || "לא צוין"}</span>}</li>
                    ); })}
                    {f.credits[r].length === 0 && <li className="muted">לא צוין במקור</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
