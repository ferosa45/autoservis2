import { DAY_KEYWORDS } from './keywords';

export type DayExtractionResult = {
  date: Date | null;
  matchedText: string | null;
};

/**
 * Najde v textu český výraz pro den ("dnes", "zítra", "středa", "st"...)
 * a vrátí odpovídající datum (čas nastaven na půlnoc, čas dne se řeší zvlášť).
 */
export function extractDay(text: string, referenceDate: Date): DayExtractionResult {
  const words = text.split(/\s+/);

  for (const word of words) {
    const cleaned = word.replace(/[.,!?]/g, '');
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

  // holé číslo 1-23, které není součástí SPZ nebo telefonu (ty se odstraňují
  // z textu ještě předtím, než je tato funkce zavolána)
  const bareNumber = text.match(/\b([0-9]|1[0-9]|2[0-3])\b/);
  if (bareNumber) {
    const hour = parseInt(bareNumber[1]!, 10);
    return { hour, minute: 0, matchedText: bareNumber[0] };
  }

  return { hour: null, minute: 0, matchedText: null };
}
