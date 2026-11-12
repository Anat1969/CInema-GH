# קולנועע (KOLNOE-GH)

אפליקציה לחקירת תפיסת עולם דרך ארבעה תפקידים קולנועיים: במאי, צלם, תסריטאי, מוזיקאי.
מסמכי המקור ב-`docs/`: spec.md (ארכיטקטורה ועיצוב), ai-persona.md (הקולנוען), lessons.md (ארבעת השיעורים ו-20 הפרומפטים).
כללי ענת: https://github.com/Anat1969/Claude-GH (הסקיל anat-standards).

## מבנה
- `src/` Vite + React + TypeScript + framer-motion. ניווט ב-hash (`#/room/director`, `#/discovery`, `#/studio/<id>`, `#/archive`, `#/s/<token>`, `#/prompts`), כך שכל מצב הוא קישור.
- `src/data/lessons.json` נוצר מ-lessons.md בלבד: `node scripts/parse-lessons.mjs docs/lessons.md`. לא עורכים ידנית.
- `supabase/functions/kolnoe/index.ts` פונקציית ה-Edge היחידה. כל גישה לטבלאות `kno_*` עוברת דרכה (service role). ללקוח אין גישה ישירה לטבלאות.
- `public/rooms/<room>/<0..4>.jpg` תמונות החדרים (0 נושא, 1 עיקרון, 2 עד 4 כללים). חסרה תמונה: `Scene` בונה אור בקוד. הפרומפטים ב-`#/prompts`.

## נתונים
- Supabase: פרויקט משותף cultura-GH (`ktqmwpbzcnzkhjskqisy`), קידומת `kno_` לכל הטבלאות. RLS פעיל, בלי policies ללקוח.
- זהות: מפתח מכשיר פרטי ב-localStorage, נשמר כ-sha256 (`owner_hash`). אין משתמשי Auth.
- הטבלאות: kno_sessions, kno_room_conversations, kno_worldview_profiles, kno_ai_calls (הגבלת קצב: 60 קריאות בשעה).

## הקולנוען
- המודל: משתנה הסביבה `KNO_MODEL` בפונקציה, ברירת מחדל `claude-sonnet-5-5`. המפתח: `ANTHROPIC_API_KEY` שכבר קיים בפרויקט.
- שאלה אחת בכל הודעה נאכפת בשרת (חיתוך אחרי סימן השאלה הראשון), ובלי סימני קריאה ואמוג'י.
- חדר נסגר אחרי 5 עד 8 תשובות: התובנה מגיעה בשורה שמתחילה ב-`[[תובנה]]`.

## חריגות מהמסמכים (הוחלט מראש)
1. Tailwind ו-shadcn לא בשימוש. CSS ישיר עם משתני עיצוב. הסיבה: ממשק של שפה אחת, בלי רכיבים גנריים.
2. כניסת Google כבויה בפרויקט Supabase. במקומה מפתח מכשיר. להפעלה: Supabase, Authentication, Providers, Google.
3. טבלת `users` מהאפיון לא נוצרה. אין משתמשי Auth.
4. תמונות מידג'רני טרם הועלו. החדרים עובדים עם גרפיקת אור מקוד.
5. אימוג'י בטבלת החדרים באפיון הוסרו (כלל: בלי אייקונים).

## בדיקה
`npm run build` ואז `npm run preview`, ובדיקת Playwright עם מוק לפונקציה (זרימה מלאה: ארבעה חדרים, גילוי, אולפן, ארכיון, שיתוף, תפריט, אין גלילה אופקית ב-390, 1280, 1865, 1920, ללא שגיאות התקנה).

## יומן תיקונים
- (12.11.2026) בנייה ראשונה.

## הספרייה (נוסף 12.11.2026)
- `public/data/library.json`: 133 דמויות מפתח (במאים, צלמים, תסריטאים, מלחינים), כ-1,000 סרטים, שיתופי פעולה בין-תחומיים ו-24 עידנים. נוצר בסקריפטים, לא נערך ידנית.
- צינור הנתונים (`scripts/`): `seed.json` (רשימה עריכתית) -> `resolve*.mjs` (זיהוי ב-Wikidata) -> `fetch-raw.mjs` (עובדות, סרטים, קרדיטים; SPARQL) -> `fetch-images.mjs` (דיוקנאות מ-Wikimedia Commons בלבד, עם יוצר ורישיון, נשמרים ב-`public/people`) -> `fetch-bios.mjs` -> `build-library.mjs`.
- עובדות רק ממקור: Wikidata (CC0), ויקיפדיה (CC BY-SA), Commons. תקצירים בעברית: `scripts/bios-he.json`, נכתבו מהתקצירים האנגליים בלבד. העידנים (`scripts/eras.json`) הם סיכום עריכתי ומסומנים כך באתר.
- ויקיפדיה בעברית מגבילה קצב בסביבת הבנייה (429). הרצה חוזרת: `node scripts/fetch-bios.mjs`, ואז לעדכן את `bios-he.json`.
- מסכים: `#/library` (אבולוציה ושיתופי פעולה), `#/library/<role>`, `#/person/<qid>`, `#/film/<qid>`.
- שלב הבא: הקולנוען משתמש בספרייה כדי להציע תפיסות שעוד לא הומצאו (פערים בין עידנים, זוגות תחומים שלא שיתפו פעולה).
