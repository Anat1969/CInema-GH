import { useEffect, useRef, useState } from "react";
import type { Msg } from "../api";
import { lsGet, lsSet } from "../api";

type Rec = { start: () => void; stop: () => void; onresult: ((e: any) => void) | null; onend: (() => void) | null; lang: string; interimResults: boolean; continuous: boolean };

function useDictation(onText: (t: string) => void) {
  const [on, setOn] = useState(false);
  const rec = useRef<Rec | null>(null);
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const toggle = () => {
    if (on) { rec.current?.stop(); return; }
    const r: Rec = new Ctor();
    r.lang = "he-IL"; r.interimResults = false; r.continuous = false;
    r.onresult = (e: any) => onText(Array.from(e.results).map((x: any) => x[0].transcript).join(" "));
    r.onend = () => setOn(false);
    rec.current = r; setOn(true); r.start();
  };
  return { supported: !!Ctor, on, toggle };
}

export interface StageProps {
  draftKey: string;
  messages: Msg[];
  busy: boolean;
  error: string;
  done: boolean;
  onSend: (text: string) => Promise<boolean>;
  placeholder: string;
  children?: React.ReactNode; // shown after the last message when done
}

export function ChatStage({ draftKey, messages, busy, error, done, onSend, placeholder, children }: StageProps) {
  const [text, setText] = useState(() => lsGet(draftKey));
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const dict = useDictation((t) => setText((x) => (x ? x + " " : "") + t));

  useEffect(() => { setText(lsGet(draftKey)); }, [draftKey]);
  useEffect(() => {
    const t = window.setTimeout(() => { lsSet(draftKey, text); if (text) setSaved(true); }, 400);
    return () => window.clearTimeout(t);
  }, [text, draftKey]);
  useEffect(() => { if (!busy && !done) taRef.current?.focus({ preventScroll: true }); }, [busy, done, messages.length]);

  const lastA = [...messages].reverse().find((m) => m.role === "assistant");
  const lastU = [...messages].reverse().find((m) => m.role === "user");
  const awaitingAnswer = messages[messages.length - 1]?.role === "assistant";

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    const ok = await onSend(t);
    if (ok) { setText(""); lsSet(draftKey, ""); setSaved(false); }
  };

  return (
    <div className="stage">
      {lastU && awaitingAnswer && messages.length > 2 && <p className="prev-answer"><span className="tag">התשובה שלך</span>{lastU.content}</p>}
      <div className="kolnoan" aria-live="polite">
        {lastA?.content.split("\n").map((line, i) => <p key={i}>{line}</p>)}
      </div>
      {done ? (
        <div className="stage-done">{children}</div>
      ) : (
        <form className="composer" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <textarea
            ref={taRef} value={text} rows={3} placeholder={placeholder} disabled={busy}
            onChange={(e) => { setText(e.target.value); setSaved(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }}
            aria-label="התשובה שלך"
          />
          <div className="composer-row">
            <button type="submit" className="btn primary" disabled={busy || !text.trim()}>{busy ? "הקולנוען מקשיב" : "שליחה"}</button>
            {dict.supported && <button type="button" className="btn soft" onClick={dict.toggle}>{dict.on ? "עצירת הקלטה" : "הקלטה"}</button>}
            <button type="button" className="btn soft" onClick={() => setHistory(true)}>מהלך השיחה</button>
            <span className="saved" aria-live="polite">{saved && text ? "נשמר" : ""}</span>
          </div>
          {error && <p className="err" role="alert">{error}</p>}
        </form>
      )}
      {history && (
        <div className="sheet" role="dialog" aria-label="מהלך השיחה" onClick={() => setHistory(false)}>
          <div className="sheet-body" onClick={(e) => e.stopPropagation()}>
            <button className="btn soft close" onClick={() => setHistory(false)}>סגירה</button>
            {messages.map((m, i) => (
              <div key={i} className={`hmsg ${m.role}`}>
                <span className="tag">{m.role === "assistant" ? "הקולנוען" : "אתה"}</span>
                {m.content.split("\n").map((l, j) => <p key={j}>{l}</p>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
