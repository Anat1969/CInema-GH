import { useEffect, useState } from "react";
import type { RoomId } from "./api";

export interface LPerson {
  id: string; roles: RoomId[]; he: string; en: string; born: number | null; died: number | null; countries: string[];
  descHe: string; descEn: string; bioHe: string; bioEn: string;
  img: { src: string; author: string; license: string; licenseUrl: string; page: string } | null;
  wiki: { he: string | null; en: string | null };
  films: { f: string; roles: RoomId[] }[]; nFilms: number;
  collab?: { id: string; films: string[]; n: number }[];
}
export interface LFilm { id: string; he: string; en: string; year: number | null; credits: Record<RoomId, { id: string | null; name: string; en: string }[]> }
export interface LEra { id: string; title: string; from: number; to: number; insight: string; text: string; people: string[] }
export interface Library {
  generated: string; source: string;
  people: Record<string, LPerson>; films: Record<string, LFilm>;
  strong: { a: string; b: string; n: number; films: string[] }[];
  eras: Record<RoomId, LEra[]>;
}

let cache: Library | null = null;
let pending: Promise<Library> | null = null;
export function loadLibrary(): Promise<Library> {
  if (cache) return Promise.resolve(cache);
  pending ||= fetch("/data/library.json").then((r) => { if (!r.ok) throw new Error("המאגר לא נטען."); return r.json() as Promise<Library>; }).then((l) => (cache = l));
  return pending;
}
export function useLibrary() {
  const [lib, setLib] = useState<Library | null>(cache);
  const [err, setErr] = useState("");
  useEffect(() => { if (!lib) loadLibrary().then(setLib).catch((e) => setErr((e as Error).message)); }, [lib]);
  return { lib, err };
}

export const ROLE_HE: Record<RoomId, string> = { director: "במאי", cinematographer: "צלם", screenwriter: "תסריטאי", musician: "מוזיקאי" };
export const ROLE_PLURAL: Record<RoomId, string> = { director: "במאים", cinematographer: "צלמים", screenwriter: "תסריטאים", musician: "מלחינים" };
export const pname = (p: LPerson) => ({ main: p.he || p.en, sub: p.he ? p.en : "" });
export const years = (p: LPerson) => (p.born ? `${p.born}${p.died ? ` – ${p.died}` : " –"}` : "");
export const ftitle = (f: LFilm) => ({ main: f.he || f.en, sub: f.he ? f.en : "" });

export const nFilms = (n: number) => (n === 1 ? "סרט אחד" : `${n} סרטים`);
export const shortAuthor = (a: string) => (a.length > 70 ? a.slice(0, 67).replace(/[ ,]+\S*$/, "") + "..." : a);
