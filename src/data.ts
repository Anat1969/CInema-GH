import lessonsRaw from "./data/lessons.json";
import type { RoomId, Profile } from "./api";

export interface Lesson {
  id: RoomId; title: string; principle: string; anchor: string; rules: string[];
  images: { kind: string; title: string; prompt: string; file: string }[];
}
export const LESSONS = lessonsRaw as Lesson[];
export const lesson = (id: RoomId) => LESSONS.find((l) => l.id === id)!;

export interface RoomMeta { id: RoomId; role: string; name: string; question: string; hue: string; soft: string }
export const ROOMS: RoomMeta[] = [
  { id: "director", role: "הבמאי", name: "חדר הבמאי", question: "מה בחרת לא לראות?", hue: "#1A1A2E", soft: "#8D8FB8" },
  { id: "cinematographer", role: "הצלם", name: "חדר הצלם", question: "מה האור מסתיר?", hue: "#2D1B00", soft: "#C9A15E" },
  { id: "screenwriter", role: "התסריטאי", name: "חדר התסריטאי", question: "מה הדמות לא מסוגלת לומר?", hue: "#0D2818", soft: "#7FB394" },
  { id: "musician", role: "המוזיקאי", name: "חדר המוזיקאי", question: "מה הגוף הרגיש לפני שהמוח הבין?", hue: "#1A0A2E", soft: "#A68BCB" },
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
