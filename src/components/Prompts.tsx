import { LESSONS, roomMeta } from "../data";
import { useJourney } from "../journey";
import { useImageExists } from "./Scene";

function Item({ roomId, im }: { roomId: string; im: { kind: string; title: string; prompt: string; file: string } }) {
  const { say } = useJourney();
  const has = useImageExists("/" + im.file);
  return (
    <li className="pitem">
      <div className="pitem-head">
        <b>{im.title}</b>
        <span className={`status ${has ? "ok" : ""}`}>{has ? "התמונה קיימת" : "מחכה לתמונה"}</span>
        <button className="btn soft" onClick={() => { void navigator.clipboard.writeText(im.prompt).then(() => say("הפרומפט הועתק")).catch(() => say("אי אפשר להעתיק כאן")); }}>העתקת הפרומפט</button>
      </div>
      <code className="mono">public/{im.file}</code>
      <pre dir="ltr">{im.prompt}</pre>
      <span hidden>{roomId}</span>
    </li>
  );
}

export function Prompts() {
  return (
    <section className="prompts">
      <p className="mono">פרומפטים לתמונות החדרים</p>
      <h1>עשרים תמונות, חמש לכל חדר</h1>
      <p className="lead">עד שהתמונות יעלו, החדרים מציגים אור שנבנה בקוד. כל תמונה שתישמר בנתיב המצוין תחליף אותו מיד.</p>
      {LESSONS.map((l) => (
        <div key={l.id} className="pgroup" style={{ ["--soft" as string]: roomMeta(l.id).soft }}>
          <h2>{roomMeta(l.id).name} — {l.title}</h2>
          <ul>{l.images.map((im) => <Item key={im.kind} roomId={l.id} im={im} />)}</ul>
        </div>
      ))}
    </section>
  );
}
