import { useEffect, useState } from "react";
import { api, type Concept, type Msg } from "../api";
import { roomMeta } from "../data";
import { useJourney } from "../journey";
import { Backdrop } from "./Scene";
import { ChatStage } from "./ChatStage";

export function Studio({ profileId }: { profileId: string }) {
  const { profiles, ready, reload } = useJourney();
  const profile = profiles.find((p) => p.id === profileId);
  const room = roomMeta("director");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !profile) return;
    api<{ messages: Msg[]; concept: Concept | null }>({ action: "studio", profileId })
      .then((r) => { setMsgs(r.messages); setConcept(r.concept); })
      .catch((e) => setError((e as Error).message));
  }, [ready, profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (text: string) => {
    setBusy(true); setError("");
    setMsgs((m) => [...m, { role: "user", content: text, timestamp: new Date().toISOString() }]);
    try {
      const r = await api<{ messages: Msg[]; concept: Concept | null }>({ action: "studio", profileId, message: text });
      setMsgs(r.messages); setConcept(r.concept);
      if (r.concept) void reload();
      return true;
    } catch (e) { setMsgs((m) => m.slice(0, -1)); setError((e as Error).message); return false; }
    finally { setBusy(false); }
  };

  if (ready && !profile) {
    return <section className="plain"><h1>התפיסה לא נמצאה</h1><a className="btn primary" href="#/archive">לארכיון</a></section>;
  }
  const turns = msgs.filter((m) => m.role === "user").length;
  const c = concept ?? profile?.film_concept ?? null;
  return (
    <section className="room studio" style={{ ["--hue" as string]: "#10101a", ["--soft" as string]: "#E9D9A8" }}>
      <Backdrop room={room} variant={concept ? 4 : 3} p={c ? 1 : Math.min(turns / 5, 0.9)} />
      <div className="room-shade" />
      <div className="room-head">
        <div>
          <span className="mono">אולפן היצירה — {profile?.worldview_name}</span>
          <h1 className="room-q">הסרט שלך</h1>
        </div>
        <span className="mono">{c ? "הקונספט מוכן" : `שאלה ${Math.min(turns + 1, 5)} מתוך 5`}</span>
      </div>
      <div className="room-body">
        {c ? (
          <div className="concept">
            <p className="mono">הרעיון</p>
            <p className="idea"><mark>{c.idea}</mark></p>
            <div className="two">
              <div><p className="mono">הפריים הראשון</p><p>{c.frame}</p></div>
              <div><p className="mono">הצליל הראשון</p><p>{c.sound}</p></div>
            </div>
            <div className="row"><a className="btn primary" href="#/archive">לארכיון הגילויים</a><a className="btn soft" href="#/discovery">לתפיסת העולם</a></div>
          </div>
        ) : (
          <ChatStage draftKey={`kno_draft_studio_${profileId}`} messages={msgs} busy={busy} error={error} done={false}
            onSend={send} placeholder="כתבו כאן, או הקליטו. Ctrl+Enter לשליחה." />
        )}
        <aside className="trail">
          <span className="mono">מתוך התפיסה</span>
          <p className="trail-name">{profile?.worldview_name}</p>
          <div className="meter"><i style={{ width: `${c ? 100 : Math.min(turns / 5, 1) * 100}%` }} /></div>
        </aside>
      </div>
    </section>
  );
}
