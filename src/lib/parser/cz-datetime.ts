import { DAY_KEYWORDS } from './keywords';

export type DayExtractionResult = {
  date: Date | null;
  matchedText: string | null;
};

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Zkusí rozpoznat číselné datum ve tvaru "8.8.", "8. 8.", "08.08.2026",
 * "8.8.26" apod. Rok je nepovinný - pokud chybí, použije se aktuální rok,
 * a pokud by tím vzniklo datum v minulosti, posune se o rok dopředu
 * (typický případ plánování dopředu přes přelom roku).
 *
 * Záměrně vyžaduje, aby po číslech dne/měsíce nenásledovalo ":" (aby si to
 * nespletl s časem typu "14:00" jako by "14" byl rok).
 */
function extractNumericDate(text: string, referenceDate: Date): DayExtractionResult {
  const match = text.match(/\b(\d{1,2})\.\s*(\d{1,2})\.(?:\s*(\d{2,4})(?!:))?/);
  if (!match) return { date: null, matchedText: null };

  const day = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return { date: null, matchedText: null };
  }

  let year = referenceDate.getFullYear();
  if (match[3]) {
    const rawYear = parseInt(match[3], 10);
    year = rawYear < 100 ? 2000 + rawYear : rawYear;
  }

  const result = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Neplatné datum (např. 31.4.) - new Date by "přetekl" do jiného měsíce,
  // což poznáme podle toho, že se den/měsíc neshodují se zadáním.
  if (result.getMonth() !== month - 1 || result.getDate() !== day) {
    return { date: null, matchedText: null };
  }

  if (!match[3]) {
    const todayMidnight = new Date(referenceDate);
    todayMidnight.setHours(0, 0, 0, 0);
    if (result < todayMidnight) {
      result.setFullYear(result.getFullYear() + 1);
    }
  }

  return { date: result, matchedText: match[0] };
}

/**
 * Najde v textu český výraz pro den ("dnes", "zítra", "středa", "st"...)
 * podle slovníku klíčových slov. Porovnává se bez diakritiky/velikosti
 * písmen, ale vrací originální podobu slova z textu (kvůli spolehlivému
 * odstranění z pracovního textu volajícím kódem).
 */
function extractDayKeyword(text: string, referenceDate: Date): DayExtractionResult {
  const words = text.split(/\s+/);

  for (const word of words) {
    const cleaned = stripDiacritics(word.replace(/[.,!?]/g, '').toLowerCase());
    const dayValue = DAY_KEYWORDS[cleaned];
    if (dayValue === undefined) continue;

    const result = new Date(referenceDate);
    result.setHours(0, 0, 0, 0);

    if (dayValue === 'today') {
      return { date: result, matchedText: word };
    }
    if (dayValue === 'tomorrow') {
      result.setDate(result.getDate() + 1);
      return { date: result, matchedText: word };
    }

    // dayValue je 0-6 (neděle-sobota) - najdi nejbližší budoucí (nebo dnešní) výskyt
    const currentDow = result.getDay();
    let diff = dayValue - currentDow;
    if (diff < 0) diff += 7;
    result.setDate(result.getDate() + diff);
    return { date: result, matchedText: word };
  }

  return { date: null, matchedText: null };
}

/**
 * Najde v textu vyjádření dne - buď číselné datum ("8.8.", "08.08.2026"),
 * nebo slovní vyjádření ("dnes", "zítra", "středa"...). Číselné datum má
 * přednost, protože je jednoznačnější.
 */
export function extractDay(text: string, referenceDate: Date): DayExtractionResult {
  const numeric = extractNumericDate(text, referenceDate);
  if (numeric.date) return numeric;

  return extractDayKeyword(text, referenceDate);
}

export type TimeExtractionResult = {
  hour: number | null;
  minute: number;
  matchedText: string | null;
};

/**
 * Najde v textu vyjádření času: "9", "9:00", "v 9", "ráno", "odpoledne".
 */
export function extractTime(text: string): TimeExtractionResult {
  // "v 9" nebo "v 9:30"
  const withPrefix = text.match(/\bv\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (withPrefix) {
    const hour = parseInt(withPrefix[1]!, 10);
    const minute = withPrefix[2] ? parseInt(withPrefix[2], 10) : 0;
    if (hour >= 0 && hour <= 23) {
      return { hour, minute, matchedText: withPrefix[0] };
    }
  }

  // "9:30"
  const withColon = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (withColon) {
    const hour = parseInt(withColon[1]!, 10);
    const minute = parseInt(withColon[2]!, 10);
    if (hour >= 0 && hour <= 23) {
      return { hour, minute, matchedText: withColon[0] };
    }
  }

  // "ráno" / "odpoledne" - orientační výchozí časy
  const morningMatch = text.match(/\br[áa]no\b/i);
  if (morningMatch) {
    return { hour: 8, minute: 0, matchedText: morningMatch[0] };
  }
  const afternoonMatch = text.match(/\bodpoledne\b/i);
  if (afternoonMatch) {
    return { hour: 13, minute: 0, matchedText: afternoonMatch[0] };
  }

  // holé číslo 1-23, které není součástí SPZ, telefonu ani data (ty se
  // odstraňují z textu ještě předtím, než je tato funkce zavolána)
  const bareNumber = text.match(/\b([0-9]|1[0-9]|2[0-3])\b/);
  if (bareNumber) {
    const hour = parseInt(bareNumber[1]!, 10);
    return { hour, minute: 0, matchedText: bareNumber[0] };
  }

  return { hour: null, minute: 0, matchedText: null };
}
