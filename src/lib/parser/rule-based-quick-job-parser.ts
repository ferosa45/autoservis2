import { prisma } from '@/lib/prisma';
import { extractDay, extractTime } from './cz-datetime';
import { BRAND_KEYWORDS, MODEL_KEYWORDS, TASK_KEYWORDS } from './keywords';
import type {
  QuickJobParser,
  QuickJobParserContext,
  QuickJobParseResult,
} from './quick-job-parser.interface';

// Hrubý odhad formátu české SPZ: 1 číslice, 1-3 písmena, 1 číslice, mezera,
// 4 číslice (např. "5T4 8241"). Nejde o přesnou validaci, jen o dost
// specifický vzor na to, aby se nepletl s telefonním číslem nebo časem.
const LICENSE_PLATE_PATTERN = /\b\d[a-z]{1,3}\d\s?\d{4}\b/i;
const PHONE_PATTERN = /\b\d{9}\b/;

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function removeMatch(text: string, matched: string): string {
  // Nahradí jen první výskyt, aby se omylem neodstranila stejná číslice/slovo
  // vyskytující se vícekrát v textu.
  const index = text.toLowerCase().indexOf(matched.toLowerCase());
  if (index === -1) return text;
  return text.slice(0, index) + ' ' + text.slice(index + matched.length);
}

export class RuleBasedQuickJobParser implements QuickJobParser {
  async parse(
    input: string,
    context: QuickJobParserContext
  ): Promise<QuickJobParseResult> {
    const now = new Date();
    let working = input.trim();

    // 1. Telefon
    let phone: string | null = null;
    const phoneMatch = working.match(PHONE_PATTERN);
    if (phoneMatch) {
      phone = phoneMatch[0];
      working = removeMatch(working, phoneMatch[0]);
    }

    // 2. SPZ
    let licensePlate: string | null = null;
    const plateMatch = working.match(LICENSE_PLATE_PATTERN);
    if (plateMatch) {
      licensePlate = plateMatch[0].toUpperCase().replace(/\s+/g, ' ').trim();
      working = removeMatch(working, plateMatch[0]);
    }

    // 3. Den (číselné datum má přednost, jinak slovní vyjádření typu "středa")
    const dayResult = extractDay(working, now);
    if (dayResult.matchedText) {
      working = removeMatch(working, dayResult.matchedText);
    }

    // 4. Čas
    const timeResult = extractTime(working);
    if (timeResult.matchedText) {
      working = removeMatch(working, timeResult.matchedText);
    }

    // 5. Zákazník - podle telefonu, jinak fuzzy shoda podle jména
    let existingCustomerId: string | null = null;
    let customerName: string | null = null;

    if (phone) {
      const byPhone = await prisma.customer.findFirst({
        where: { garageId: context.garageId, phone: { contains: phone } },
      });
      if (byPhone) {
        existingCustomerId = byPhone.id;
        customerName = byPhone.name;
      }
    }

    let remainingWords = working.split(/\s+/).filter(Boolean);

    if (!existingCustomerId && remainingWords.length > 0) {
      const candidates = await prisma.customer.findMany({
        where: { garageId: context.garageId },
      });

      outer: for (const word of remainingWords.slice(0, 2)) {
        const normalizedWord = stripDiacritics(word.toLowerCase());
        if (normalizedWord.length < 3) continue;

        for (const candidate of candidates) {
          const nameParts = stripDiacritics(candidate.name.toLowerCase()).split(/\s+/);
          const isMatch = nameParts.some(
            (part) => part.startsWith(normalizedWord) || normalizedWord.startsWith(part)
          );
          if (isMatch) {
            existingCustomerId = candidate.id;
            customerName = candidate.name;
            remainingWords = remainingWords.filter((w) => w !== word);
            break outer;
          }
        }
      }
    }

    // 6. Vozidlo - podle SPZ, jinak podle značky/modelu ve slovníku,
    // s preferencí vozidel patřících už rozpoznanému zákazníkovi
    let existingVehicleId: string | null = null;
    let vehicleBrand: string | null = null;
    let vehicleModel: string | null = null;

    if (licensePlate) {
      const normalizedPlate = licensePlate.replace(/\s+/g, '');
      const vehicles = await prisma.vehicle.findMany({
        where: { garageId: context.garageId },
      });
      const byPlate = vehicles.find(
        (v) => v.licensePlate?.replace(/\s+/g, '').toUpperCase() === normalizedPlate
      );
      if (byPlate) {
        existingVehicleId = byPlate.id;
        vehicleBrand = byPlate.brand;
        vehicleModel = byPlate.model;
      }
    }

    if (!existingVehicleId && remainingWords.length > 0) {
      const candidateVehicles = existingCustomerId
        ? await prisma.vehicle.findMany({
            where: { garageId: context.garageId, customerId: existingCustomerId },
          })
        : [];

      for (const word of [...remainingWords]) {
        const normalizedWord = stripDiacritics(word.toLowerCase());

        // a) shoda s modelem existujícího vozidla zákazníka
        const vehicleMatch = candidateVehicles.find((v) =>
          stripDiacritics(v.model.toLowerCase()).includes(normalizedWord)
        );
        if (vehicleMatch) {
          existingVehicleId = vehicleMatch.id;
          vehicleBrand = vehicleMatch.brand;
          vehicleModel = vehicleMatch.model;
          remainingWords = remainingWords.filter((w) => w !== word);
          break;
        }

        // b) shoda se slovníkem modelů (bez ohledu na DB)
        if (MODEL_KEYWORDS[normalizedWord]) {
          vehicleBrand = MODEL_KEYWORDS[normalizedWord].brand;
          vehicleModel = MODEL_KEYWORDS[normalizedWord].model;
          remainingWords = remainingWords.filter((w) => w !== word);
          continue;
        }

        // c) shoda se slovníkem značek
        if (BRAND_KEYWORDS[normalizedWord]) {
          vehicleBrand = BRAND_KEYWORDS[normalizedWord];
          remainingWords = remainingWords.filter((w) => w !== word);
        }
      }
    }

    // 7. Úkony - hledáme podle klíčových slov, zbytek necháme jako
    // nerozpoznaný text (uživatel doplní ručně v potvrzovacím kroku)
    const tasks: string[] = [];
    let leftover = remainingWords.join(' ');

    for (const { pattern, label } of TASK_KEYWORDS) {
      if (pattern.test(leftover)) {
        tasks.push(label);
        leftover = leftover.replace(pattern, '').trim();
      }
    }

    leftover = leftover.replace(/\s+/g, ' ').trim();
    if (leftover.length > 0) {
      // Nerozpoznaná slova radši přidáme jako vlastní úkon, než abychom je
      // zahodili - lepší nechat uživatele smazat nadbytečné, než mu chybět info.
      tasks.push(leftover.charAt(0).toUpperCase() + leftover.slice(1));
    }

    // 8. Sestavení scheduledStart
    let scheduledStart: Date | null = null;
    if (dayResult.date || timeResult.hour !== null) {
      const base = dayResult.date ? new Date(dayResult.date) : new Date(now);
      base.setHours(timeResult.hour ?? 8, timeResult.minute, 0, 0);
      scheduledStart = base;
    }

    return {
      customer: { existingCustomerId, name: customerName, phone },
      vehicle: { existingVehicleId, brand: vehicleBrand, model: vehicleModel, licensePlate },
      tasks,
      scheduledStart,
      unrecognizedText: null,
    };
  }
}
