export type QuickJobParserContext = {
  garageId: string;
};

export type QuickJobParsedCustomer = {
  /** Pokud existuje shoda v DB, obsahuje jeho id */
  existingCustomerId: string | null;
  name: string | null;
  phone: string | null;
};

export type QuickJobParsedVehicle = {
  /** Pokud existuje shoda v DB, obsahuje jeho id */
  existingVehicleId: string | null;
  brand: string | null;
  model: string | null;
  licensePlate: string | null;
};

export type QuickJobParseResult = {
  customer: QuickJobParsedCustomer;
  vehicle: QuickJobParsedVehicle;
  /** Rozpoznané úkony/požadavky, každý jako samostatný řádek */
  tasks: string[];
  scheduledStart: Date | null;
  /** Vstupní text, který se nepodařilo přiřadit k žádnému poli */
  unrecognizedText: string | null;
};

/**
 * Rozhraní pro parsování volného textu do návrhu zakázky.
 *
 * Implementace NESMÍ nikdy vyhodit chybu kvůli nerozpoznanému vstupu -
 * v tom případě vrátí částečný výsledek s null hodnotami a text
 * v unrecognizedText, aby uživatel mohl doplnit chybějící údaje ručně.
 *
 * Pro MVP: RuleBasedQuickJobParser (pravidlový parser bez AI).
 * Do budoucna: AIQuickJobParser (stejné rozhraní, LLM backend) -
 * UI se při výměně implementace nemění.
 */
export interface QuickJobParser {
  parse(input: string, context: QuickJobParserContext): Promise<QuickJobParseResult>;
}
