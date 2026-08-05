import type {
  QuickJobParser,
  QuickJobParserContext,
  QuickJobParseResult,
} from './quick-job-parser.interface';

/**
 * Pravidlový (non-AI) parser volného textu pro rychlé zapsání zakázky.
 *
 * POZNÁMKA: Toto je zatím jen kostra odpovídající rozhraní z Fáze 1/2.
 * Skutečná logika (fuzzy hledání zákazníka/vozidla v DB, rozpoznávání
 * českých výrazů pro dny a čas) se implementuje ve Fázi 4 spolu
 * s celým flow rychlého vytvoření zakázky - je to nejdůležitější
 * a nejcitlivější část UX, proto ji necháváme na samostatnou fázi
 * s možností iterace na skutečných seed datech.
 */
export class RuleBasedQuickJobParser implements QuickJobParser {
  async parse(
    input: string,
    _context: QuickJobParserContext
  ): Promise<QuickJobParseResult> {
    return {
      customer: { existingCustomerId: null, name: null, phone: null },
      vehicle: { existingVehicleId: null, brand: null, model: null, licensePlate: null },
      tasks: [],
      scheduledStart: null,
      unrecognizedText: input,
    };
  }
}
