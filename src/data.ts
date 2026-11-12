import lessonsRaw from "./data/lessons.json";
import type { RoomId, Profile } from "./api";

export interface Lesson {
  id: RoomId; title: string; principle: string; anchor: string; rules: string[];
  images: { kind: string; title: string; prompt: string; file: string }[];
}
export const LESSONS = lessonsRaw as Lesson[];
export const lesson = (id: RoomId) => LESSONS.find((l) => l.id === id)!;

export interface RoomMeta { id: RoomId; role: string; name: string; question: string; hue: string; soft: string; tint: string; deep: string }
export const ROOMS: RoomMeta[] = [
  { id: "director", role: "הבמאי", name: "חדר הבמאי", question: "מה בחרת לא לראות?", hue: "#6C789C", soft: "#B4BCD8", tint: "#EFF1F7", deep: "#2F3754" },
  { id: "cinematographer", role: "הצלם", name: "חדר הצלם", question: "מה האור מסתיר?", hue: "#B08E5C", soft: "#E3CDA1", tint: "#F8F2E7", deep: "#4F3B1F" },
  { id: "screenwriter", role: "התסריטאי", name: "חדר התסריטאי", question: "מה הדמות לא מסוגלת לומר?", hue: "#6A927B", soft: "#B0D2BE", tint: "#EEF5F0", deep: "#27442F" },
  { id: "musician", role: "המוזיקאי", name: "חדר המוזיקאי", question: "מה הגוף הרגיש לפני שהמוח הבין?", hue: "#8D7AAE", soft: "#C3B4DC", tint: "#F2EFF8", deep: "#3E3060" },
];
export const roomMeta = (id: string) => ROOMS.find((r) => r.id === id)!;
export const isRoom = (s: string): s is RoomId => ROOMS.some((r) => r.id === s);

export const DEV_CHAT = "https://claude.ai/code/session_018qeN18Gye3Roqe9duHYHXq";

export const tail = (after: string) => (after.startsWith(".") ? after : " " + after);

export function worldviewLines(p: Pick<Profile, "director_insight" | "cinematographer_insight" | "screenwriter_insight" | "musician_insight">) {
  return [
    { id: "director" as RoomId, role: "הבמאי", before: "הבמאי שלך בחר לא להראות", key: p.director_insight, after: "." },
    { id: "cinematographer" as RoomId, role: "הצלם", before: "הצלם שלך הסתיר", key: p.cinematographer_insight, after: "באור." },
    { id: "screenwriter" as RoomId, role: "התסריטאי", before: "הדמות שלך לא הצליחה לומר", key: p.screenwriter_insight, after: "." },
    { id: "musician" as RoomId, role: "המוזיקאי", before: "המוזיקה שלך הגיעה", key: p.musician_insight, after: "שניות לפני שהמוח הבין." },
  ];
}

export interface Axis { a: string; b: string; m: string; hint: string }
export const AXES: Record<RoomId, Axis> = {
  director: { a: "הפריים בנוי מראש", b: "הפריים נמצא במציאות", m: "שניהם יחד", hint: "האם הבמאי מתכנן כל פריים, או נותן למציאות להפתיע אותו?" },
  cinematographer: { a: "אור בנוי", b: "אור קיים", m: "שניהם יחד", hint: "האם הצלם בונה את האור, או מוצא אותו במקום?" },
  screenwriter: { a: "סיפור בנוי למבנה", b: "סיפור שנוצר מרגעים", m: "שניהם יחד", hint: "האם התסריט נבנה סביב מבנה, או סביב רגעים?" },
  musician: { a: "המוזיקה מובילה את הרגש", b: "המוזיקה משאירה מרחב", m: "שניהם יחד", hint: "האם המוזיקה אומרת לצופה מה להרגיש, או משאירה לו מקום?" },
};
export const ROOM_ORDER: RoomId[] = ["director", "cinematographer", "screenwriter", "musician"];
export const searchUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
