export type RoomId = "director" | "cinematographer" | "screenwriter" | "musician";
export interface Msg { role: "user" | "assistant"; content: string; timestamp: string }
export interface Conv { room: string; messages: Msg[]; worldview_insight: string | null }
export interface Concept { idea: string; frame: string; sound: string }
export interface Profile {
  id: string; session_id?: string;
  director_insight: string; cinematographer_insight: string; screenwriter_insight: string; musician_insight: string;
  worldview_name: string; film_concept: Concept | null; created_at: string; is_shared: boolean; share_token: string | null;
}
export type PublicProfile = Omit<Profile, "id" | "is_shared" | "share_token">;

const BASE = "https://ktqmwpbzcnzkhjskqisy.supabase.co/functions/v1/";
const FN = BASE + "kolnoe";
let memKey = "";

export function deviceKey(): string {
  try {
    let k = localStorage.getItem("kno_device");
    if (!k) {
      k = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
      localStorage.setItem("kno_device", k);
    }
    return k;
  } catch {
    if (!memKey) memKey = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
    return memKey;
  }
}

export async function api<T>(body: Record<string, unknown>, fn = "kolnoe"): Promise<T> {
  let r: Response;
  try {
    r = await fetch(BASE + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, deviceKey: deviceKey() }),
    });
  } catch {
    throw new Error("אין חיבור לשרת. בדקו את הרשת ונסו שוב.");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || "משהו השתבש. נסו שוב.");
  return j as T;
}

export const lsGet = (k: string): string => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
export const lsSet = (k: string, v: string) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* private mode */ } };
