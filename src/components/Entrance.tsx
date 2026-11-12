import { useJourney } from "../journey";
import { ROOMS } from "../data";
import { Scene } from "./Scene";

export function Entrance() {
  const { completed, convs, ready, error, reload } = useJourney();
  const all = completed.length === 4;
  return (
    <section className="entrance">
      <div className="entrance-head">
        <p className="mono">קולנועע — קולנוע ותנועה</p>
        <h1>מה הסרט האחרון שלא הצלחת לשכוח?</h1>
        <p className="lead">בחרו חדר. הקולנוען ישאל שאלה אחת בכל פעם, וממה שתענו תתגלה תפיסת העולם שלכם.</p>
      </div>
      <div className="tiles">
        {ROOMS.map((r, i) => {
          const done = completed.includes(r.id);
          const turns = (convs[r.id]?.messages ?? []).filter((m) => m.role === "user").length;
          return (
            <a key={r.id} className="tile" href={`#/room/${r.id}`} style={{ ["--hue" as string]: r.hue, ["--soft" as string]: r.soft }}>
              <Scene room={r} variant={i} p={done ? 0.9 : turns ? 0.5 : 0.15} />
              <span className="tile-shade" />
              <span className="mono">{r.name}</span>
              <strong>{r.question}</strong>
              <em>{done ? "הושלם" : turns ? "בהמשך" : "חדר חדש"}</em>
            </a>
          );
        })}
      </div>
      <div className="entrance-foot">
        {all ? (
          <a className="btn primary" href="#/discovery">לחדר הגילוי</a>
        ) : (
          <p className="muted">חדר הגילוי נפתח אחרי ארבעת החדרים. הושלמו {completed.length} מתוך 4.</p>
        )}
        <a className="btn soft" href="#/archive">ארכיון הגילויים</a>
        <span className="muted small">{ready && error ? <>אין חיבור לשרת. <button className="link" onClick={() => void reload()}>ניסיון נוסף</button></> : "ההתקדמות נשמרת במכשיר הזה, בלי סיסמה."}</span>
      </div>
    </section>
  );
}
