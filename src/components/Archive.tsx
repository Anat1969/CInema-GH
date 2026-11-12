import { useState } from "react";
import { api, type Profile } from "../api";
import { tail, worldviewLines } from "../data";
import { useJourney } from "../journey";

export function Archive() {
  const { profiles, putProfile, say, ready, reload } = useJourney();
  const [busy, setBusy] = useState("");
  const link = (t: string) => `${location.origin}/#/s/${t}`;

  const toggle = async (p: Profile) => {
    setBusy(p.id);
    try {
      const r = await api<{ profile: Profile }>({ action: "share", profileId: p.id, on: !p.is_shared });
      putProfile(r.profile);
      if (r.profile.is_shared && r.profile.share_token) {
        try { await navigator.clipboard.writeText(link(r.profile.share_token)); say("הקישור לשיתוף הועתק"); } catch { say("השיתוף פעיל"); }
      } else say("השיתוף בוטל");
    } catch (e) { say((e as Error).message); } finally { setBusy(""); }
  };
  const fresh = async () => {
    try { await api({ action: "newJourney" }); await reload(); say("מסע חדש התחיל"); location.hash = "#/"; } catch (e) { say((e as Error).message); }
  };

  return (
    <section className="archive">
      <div className="archive-head">
        <p className="mono">ארכיון הגילויים</p>
        <h1>{profiles.length ? "התפיסות שגילית" : "עוד אין תפיסות בארכיון"}</h1>
        <p className="lead">{profiles.length ? "כל תפיסת עולם שנחשפה נשמרת כאן. אפשר לשתף אותה בקישור." : "אחרי ארבעת החדרים הקולנוען ינסח את התפיסה הראשונה שלך."}</p>
        {ready && <button className="btn soft" onClick={fresh}>מסע חדש</button>}
      </div>
      <div className="cards">
        {profiles.map((p) => (
          <article key={p.id} className="acard">
            <p className="mono">{new Date(p.created_at).toLocaleDateString("he-IL")}</p>
            <h2><mark>{p.worldview_name}</mark></h2>
            <ul>
              {worldviewLines(p).map((l) => (
                <li key={l.id}><span className="tag">{l.role}</span>{l.before} <b>{l.key}</b>{tail(l.after)}</li>
              ))}
            </ul>
            {p.film_concept && (
              <div className="mini-concept">
                <p><span className="tag">הרעיון</span>{p.film_concept.idea}</p>
                <p><span className="tag">פריים</span>{p.film_concept.frame}</p>
                <p><span className="tag">צליל</span>{p.film_concept.sound}</p>
              </div>
            )}
            <div className="row">
              {!p.film_concept && <a className="btn primary" href={`#/studio/${p.id}`}>לכתוב ממנה סרט</a>}
              <button className="btn soft" disabled={busy === p.id} onClick={() => void toggle(p)}>
                {p.is_shared ? "ביטול שיתוף" : "שתף את תפיסת העולם שלך"}
              </button>
              {p.is_shared && p.share_token && (
                <button className="btn soft" onClick={() => { void navigator.clipboard.writeText(link(p.share_token!)).then(() => say("הקישור הועתק")).catch(() => say(link(p.share_token!))); }}>העתקת קישור</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
