import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";

/**
 * Argument name → ICU element type for every placeholder in a message
 * (`{name}`, `{count, plural, ...}`, ...), including ones nested inside
 * plural/select branches. Throws on a malformed message.
 */
function collectArguments(elements: MessageFormatElement[], into: Map<string, number>) {
  for (const element of elements) {
    switch (element.type) {
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
        into.set(element.value, element.type);
        break;
      case TYPE.select:
      case TYPE.plural:
        into.set(element.value, element.type);
        for (const option of Object.values(element.options)) {
          collectArguments(option.value, into);
        }
        break;
      case TYPE.tag:
        // Site texts are plain text — markup would need t.rich() at the call site.
        throw new Error("TAGS_NOT_ALLOWED");
    }
  }
}

export function getPlaceholders(message: string): Map<string, number> {
  const found = new Map<string, number>();
  collectArguments(parse(message, { requiresOtherClause: true }), found);
  return found;
}

export type SiteTextProblem = "invalid" | "tags" | "placeholders";

/**
 * Checks that an edited message can safely replace the default one: it must
 * parse, contain no markup, and use exactly the same placeholders — a
 * missing or misspelled `{count}` would otherwise throw when the public page
 * renders. Returns null when fine, otherwise a machine-readable problem.
 */
export function checkAgainstDefault(value: string, defaultValue: string): SiteTextProblem | null {
  let placeholders: Map<string, number>;
  try {
    placeholders = getPlaceholders(value);
  } catch (error) {
    return error instanceof Error && error.message === "TAGS_NOT_ALLOWED" ? "tags" : "invalid";
  }

  const expected = getPlaceholders(defaultValue);
  if (expected.size !== placeholders.size) return "placeholders";
  for (const [name, type] of expected) {
    if (placeholders.get(name) !== type) return "placeholders";
  }
  return null;
}
