import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api, type Profile } from "../api";
import { ROOMS, roomMeta, tail, worldviewLines } from "../data";
import { useJourney } from "../journey";

export function WorldviewPoster({ p, cta }: { p: Pick<Profile, "director_insight" | "cinematographer_insight" | "screenwriter_insight" | "musician_insight" | "worldview_name">; cta?: React.ReactNode }) {
  const lines = worldviewLines(p);
  return (
    <div className="poster">
      <div className="poster-lines">
        {lines.map((l, i) => {
          const m = roomMeta(l.id);
          return (
            <motion.p key={l.id} className="pline" style={{ ["--soft" as string]: m.soft, ["--hue" as string]: m.hue }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 * i, duration: 0.7 }}>
              <span className="tag">{l.role}</span>
              {l.before} <b>{l.key}</b>{tail(l.after)}
            </motion.p>
          );
        })}
      </div>
      <motion.div className="poster-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}>
        <span className="mono">תפיסת עולם קולנועית</span>
        <h1><mark>{p.worldview_name}</mark></h1>
        {cta}
      </motion.div>
    </div>
  );
}

export function Discovery() {
  const { completed, ready, profiles, putProfile, reload } = useJourney();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const asked = useRef(false);
  const all = completed.length === 4;

  const run = () => {
    setBusy(true); setErr("");
    api<{ profile: Profile }>({ action: "discover" })
      .then((r) => { setProfile(r.profile); putProfile(r.profile); })
      .catch((e) => setErr((e as Error).message))
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    if (!ready || !all || asked.current) return;
    asked.current = true;
    run();
  }, [ready, all]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void reload; }, [reload]);

  if (!ready) return <section className="plain"><p className="muted">טוען.</p></section>;
  if (!all) {
    return (
      <section className="plain">
        <p className="mono">חדר הגילוי</p>
        <h1>הגילוי נפתח אחרי ארבעת החדרים</h1>
        <p className="lead">הקולנוען מחבר את ארבע התובנות לתפיסת עולם אחת, ונותן לה שם.</p>
        <ul className="checklist">
          {ROOMS.map((r) => (
            <li key={r.id} className={completed.includes(r.id) ? "ok" : ""}>
              <a href={`#/room/${r.id}`}>{r.name}</a><em>{completed.includes(r.id) ? "הושלם" : "עוד לא"}</em>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  const shown = profile ?? profiles[0] ?? null;
  return (
    <section className="discovery">
      {shown ? (
        <WorldviewPoster p={shown} cta={
          <div className="row">
            <a className="btn primary" href={`#/studio/${shown.id}`}>רוצה לכתוב ממנה סרט?</a>
            <a className="btn soft" href="#/archive">לארכיון</a>
          </div>
        } />
      ) : (
        <div className="plain">
          <p className="mono">חדר הגילוי</p>
          <h1>{busy ? "הקולנוען מחבר את ארבע התובנות" : "התפיסה עוד לא נוסחה"}</h1>
          {err && <p className="err" role="alert">{err}</p>}
          {!busy && <button className="btn primary" onClick={run}>ניסוח התפיסה</button>}
        </div>
      )}
    </section>
  );
}
