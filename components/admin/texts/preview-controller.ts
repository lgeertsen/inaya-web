import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";

/**
 * Drives the public-site preview iframe of the text editor.
 *
 * The public pages are statically generated, so strings can't be tagged at
 * render time. Instead, once the page has hydrated, this walks the DOM and
 * matches rendered text (and alt/placeholder/aria-label/title attributes)
 * back to message keys by comparing against the site's current messages.
 * It then handles hover/selection outlines, click-to-select, and live
 * updating of texts while the admin types. The iframe is same-origin.
 */

export type Region = "banner" | "header" | "page" | "footer";
export type ElementRole =
  | "title"
  | "subtitle"
  | "paragraph"
  | "link"
  | "button"
  | "list"
  | "option"
  | "image"
  | "field"
  | "label"
  | "other";

export interface KeyLocation {
  region: Region;
  role: ElementRole;
  /** Text of the closest heading above this element, for orientation. */
  heading: string | null;
  /** Position in document order (0 = topmost). */
  order: number;
  /** False when the text only exists in hidden UI (closed menu, ...). */
  visible: boolean;
  /** True when the message has {placeholders} and so can't be previewed live. */
  hasPlaceholders: boolean;
  /** Other keys whose text is identical at the same spot on the page. */
  sharedWith: string[];
}

export interface TextIndexEntry {
  key: string;
  /** Every string this key may currently render as (saved value, unsaved draft). */
  values: string[];
}

export interface ScanInput {
  entries: TextIndexEntry[];
  /** Key prefixes owned by the page being edited — preferred when a text matches several keys. */
  preferPrefixes: string[];
}

export interface PreviewCallbacks {
  onLocated: (locations: Record<string, KeyLocation>) => void;
  onSelect: (key: string) => void;
  onHover: (key: string | null) => void;
}

const SHARED_PREFIXES = ["announcement", "nav", "footer", "common"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "NEXTJS-PORTAL"]);
const ATTRIBUTES = ["alt", "placeholder", "aria-label", "title"] as const;

interface Hit {
  el: HTMLElement;
  node: Text | null;
  attr: string | null;
  /** The key this spot belongs to (best match for the page being edited). */
  keys: [string];
  /** Other keys with identical wording — a coincidence, not the same string. */
  others: string[];
  region: Region;
  role: ElementRole;
  heading: string | null;
  order: number;
  visible: boolean;
  hasPlaceholders: boolean;
}

/**
 * `instanceof Element` is false for nodes from the iframe's window (different
 * realm), so element checks on iframe events must go through nodeType.
 */
function isElement(value: unknown): value is HTMLElement {
  return !!value && (value as Node).nodeType === 1;
}

export function normalizeText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Regex matching the rendered form of an ICU message, or null when it can't be matched reliably. */
function messageToRegex(message: string): RegExp | null {
  let elements: MessageFormatElement[];
  try {
    elements = parse(message);
  } catch {
    return null;
  }

  let literalChars = 0;
  const parts = elements.map((element, index) => {
    if (element.type === TYPE.literal) {
      let text = normalizeText(`x${element.value}x`).slice(1, -1);
      if (index === 0) text = text.trimStart();
      if (index === elements.length - 1) text = text.trimEnd();
      literalChars += text.replace(/\s/g, "").length;
      return escapeRegex(text);
    }
    return ".+?";
  });

  if (literalChars < 2) return null;
  try {
    return new RegExp(`^${parts.join("")}$`, "s");
  } catch {
    return null;
  }
}

interface TextIndex {
  exact: Map<string, string[]>;
  patterns: { key: string; regex: RegExp }[];
  placeholderKeys: Set<string>;
}

function buildIndex(entries: TextIndexEntry[]): TextIndex {
  const exact = new Map<string, string[]>();
  const patterns: TextIndex["patterns"] = [];
  const placeholderKeys = new Set<string>();

  for (const { key, values } of entries) {
    for (const value of new Set(values)) {
      if (value.includes("{")) {
        placeholderKeys.add(key);
        const regex = messageToRegex(value);
        if (regex) patterns.push({ key, regex });
        continue;
      }
      const normalized = normalizeText(value);
      if (!normalized) continue;
      const keys = exact.get(normalized);
      if (!keys) exact.set(normalized, [key]);
      else if (!keys.includes(key)) keys.push(key);
    }
  }
  return { exact, patterns, placeholderKeys };
}

function matchKeys(index: TextIndex, text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const exact = index.exact.get(normalized);
  if (exact) return exact;
  const matches: string[] = [];
  for (const { key, regex } of index.patterns) {
    if (regex.test(normalized) && !matches.includes(key)) matches.push(key);
  }
  return matches;
}

function prefixRank(key: string, prefixes: string[]): number {
  let best = 1_000_000; // finite, so comparing two unranked keys yields 0 rather than NaN
  for (const prefix of prefixes) {
    if (key === prefix || key.startsWith(`${prefix}.`)) {
      // Longer (more specific) prefixes rank first.
      best = Math.min(best, 1000 - prefix.length);
    }
  }
  return best;
}

function regionOf(el: Element): Region {
  // Anything inside <main> is page content, even if it uses <header>/<footer> elements itself.
  if (el.closest("main")) return "page";
  if (el.closest("footer")) return "footer";
  if (el.closest("header")) return "header";
  return "banner";
}

function roleOf(el: Element, attr: string | null, isOption: boolean): ElementRole {
  if (isOption) return "option";
  if (attr === "alt") return "image";
  if (attr === "placeholder") return "field";
  if (attr) return "label";
  if (el.closest("h1")) return "title";
  if (el.closest("h2, h3, h4, h5, h6")) return "subtitle";
  if (el.closest("a")) return "link";
  if (el.closest("button")) return "button";
  if (el.closest("li")) return "list";
  if (el.closest("label")) return "label";
  if (el.closest("p")) return "paragraph";
  return "other";
}

function isVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === "function") {
    return el.checkVisibility({ visibilityProperty: true, opacityProperty: false });
  }
  return el.getClientRects().length > 0;
}

const STYLE = `
[data-txe]{cursor:pointer}
html.txe-all [data-txe]{outline:1px dotted rgba(223,23,203,.65);outline-offset:2px}
[data-txe]:hover{outline:2px dashed #df17cb!important;outline-offset:2px;background-color:rgba(223,23,203,.07)}
[data-txe-state~="dirty"]{outline:2px solid #d97706!important;outline-offset:2px;background-color:rgba(217,119,6,.10)}
[data-txe-state~="hover"]{outline:2px dashed #df17cb!important;outline-offset:3px;background-color:rgba(223,23,203,.10)}
[data-txe-state~="selected"]{outline:3px solid #df17cb!important;outline-offset:3px;background-color:rgba(223,23,203,.12);border-radius:4px}
#txe-badge{position:absolute;z-index:2147483000;pointer-events:none;background:#df17cb;color:#fff;font:700 11px/1 system-ui,sans-serif;letter-spacing:.02em;padding:5px 8px;border-radius:6px 6px 6px 0;box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:nowrap;display:none}
`;

export class PreviewController {
  private hits: Hit[] = [];
  private byKey = new Map<string, Hit[]>();
  private byElement = new Map<HTMLElement, Hit[]>();
  private originals = new WeakMap<object, string>();
  private drafts: Record<string, string> = {};
  private appliedKeys = new Set<string>();
  private placeholderKeys = new Set<string>();
  private selected: string | null = null;
  private hovered: string | null = null;
  private lastHoverReported: string | null = null;
  private observer: MutationObserver;
  private badge: HTMLElement;
  private styleEl: HTMLStyleElement;
  private rescanTimer: number | undefined;
  private badgeFrame: number | undefined;
  private destroyed = false;

  constructor(
    private doc: Document,
    private getInput: () => ScanInput,
    private callbacks: PreviewCallbacks,
    private badgeLabel: string,
  ) {
    const view = doc.defaultView!;

    this.styleEl = doc.createElement("style");
    this.styleEl.setAttribute("data-txe-ui", "");
    this.styleEl.textContent = STYLE;
    doc.head.appendChild(this.styleEl);

    this.badge = doc.createElement("div");
    this.badge.id = "txe-badge";
    this.badge.setAttribute("data-txe-ui", "");
    this.badge.textContent = badgeLabel;
    doc.body.appendChild(this.badge);

    doc.addEventListener("click", this.handleClick, true);
    doc.addEventListener("submit", this.handleSubmit, true);
    doc.addEventListener("mouseover", this.handleOver, true);
    doc.addEventListener("mouseleave", this.handleLeave, true);
    view.addEventListener("scroll", this.scheduleBadge, { passive: true });
    view.addEventListener("resize", this.scheduleBadge, { passive: true });

    this.observer = new MutationObserver((records) => {
      const relevant = records.some(
        (record) => !(isElement(record.target) && record.target.closest("[data-txe-ui]")),
      );
      if (relevant) this.scheduleRescan();
    });
    this.observer.observe(doc.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ scan */

  scan() {
    if (this.destroyed) return;
    const { entries, preferPrefixes } = this.getInput();
    const index = buildIndex(entries);
    this.placeholderKeys = index.placeholderKeys;

    for (const el of this.byElement.keys()) {
      el.removeAttribute("data-txe");
      el.removeAttribute("data-txe-state");
    }

    interface Candidate {
      el: HTMLElement;
      node: Text | null;
      attr: string | null;
      keys: string[];
      /** Text of a dropdown <option>; `el` is then the visible <select> that holds it. */
      isOption: boolean;
    }
    const candidates: Candidate[] = [];

    const walker = this.doc.createTreeWalker(this.doc.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-txe-ui], nextjs-portal")) continue;
      const keys = matchKeys(index, node.data);
      if (keys.length === 0) continue;
      // <option> elements have no box of their own — attribute them to their <select>.
      const isOption = parent.tagName === "OPTION" || parent.tagName === "OPTGROUP";
      const el = isOption ? (parent.closest("select") ?? parent) : parent;
      candidates.push({ el, node, attr: null, keys, isOption });
    }

    for (const attr of ATTRIBUTES) {
      for (const el of this.doc.querySelectorAll<HTMLElement>(`[${attr}]`)) {
        if (el.closest("[data-txe-ui], nextjs-portal")) continue;
        const keys = matchKeys(index, el.getAttribute(attr) ?? "");
        if (keys.length > 0) candidates.push({ el, node: null, attr, keys, isOption: false });
      }
    }

    candidates.sort((a, b) => {
      if (a.el === b.el) return 0;
      const position = a.el.compareDocumentPosition(b.el);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    const headings = Array.from(this.doc.querySelectorAll<HTMLElement>("h1, h2, h3"));

    this.hits = candidates.map((candidate, order) => {
      const region = regionOf(candidate.el);
      const ranked = [...candidate.keys].sort((a, b) => {
        const preferred = region === "page" ? [...preferPrefixes, ...SHARED_PREFIXES] : [...SHARED_PREFIXES, ...preferPrefixes];
        return prefixRank(a, preferred) - prefixRank(b, preferred);
      });

      let heading: string | null = null;
      if (!candidate.el.closest("h1, h2, h3")) {
        for (const h of headings) {
          if (h.compareDocumentPosition(candidate.el) & Node.DOCUMENT_POSITION_FOLLOWING) {
            heading = normalizeText(h.textContent ?? "") || heading;
          } else break;
        }
      }

      return {
        el: candidate.el,
        node: candidate.node,
        attr: candidate.attr,
        keys: [ranked[0]],
        others: ranked.slice(1),
        region,
        role: roleOf(candidate.el, candidate.attr, candidate.isOption),
        heading,
        order,
        visible: isVisible(candidate.el),
        hasPlaceholders: index.placeholderKeys.has(ranked[0]),
      };
    });

    this.byKey.clear();
    this.byElement.clear();
    for (const hit of this.hits) {
      hit.el.setAttribute("data-txe", "");
      const onElement = this.byElement.get(hit.el);
      if (onElement) onElement.push(hit);
      else this.byElement.set(hit.el, [hit]);
      for (const key of hit.keys) {
        const list = this.byKey.get(key);
        if (list) list.push(hit);
        else this.byKey.set(key, [hit]);
      }
    }

    const locations: Record<string, KeyLocation> = {};
    for (const [key, hits] of this.byKey) {
      const primary = hits.find((hit) => hit.visible) ?? hits[0];
      locations[key] = {
        region: primary.region,
        role: primary.role,
        heading: primary.heading,
        order: primary.order,
        visible: hits.some((hit) => hit.visible),
        hasPlaceholders: primary.hasPlaceholders,
        sharedWith: primary.others,
      };
    }

    this.applyDrafts();
    this.refreshMarks();
    this.observer.takeRecords();
    this.callbacks.onLocated(locations);
  }

  private scheduleRescan = () => {
    window.clearTimeout(this.rescanTimer);
    this.rescanTimer = window.setTimeout(() => this.scan(), 300);
  };

  /* ---------------------------------------------------------------- drafts */

  /** Shows unsaved edits live in the page. `drafts` holds only keys whose draft differs from the saved value. */
  setDrafts(drafts: Record<string, string>) {
    this.drafts = drafts;
    this.applyDrafts();
    this.refreshMarks();
    this.observer.takeRecords();
  }

  private applyDrafts() {
    const next = new Set(Object.keys(this.drafts));
    for (const key of this.appliedKeys) {
      if (!next.has(key)) this.revert(key);
    }
    for (const key of next) {
      if (this.placeholderKeys.has(key)) continue;
      for (const hit of this.byKey.get(key) ?? []) this.write(hit, this.drafts[key]);
    }
    this.appliedKeys = new Set([...next].filter((key) => !this.placeholderKeys.has(key)));
  }

  private write(hit: Hit, text: string) {
    if (hit.node) {
      if (!this.originals.has(hit.node)) this.originals.set(hit.node, hit.node.data);
      if (hit.node.data !== text) hit.node.data = text;
    } else if (hit.attr) {
      if (!this.originals.has(hit.el)) this.originals.set(hit.el, hit.el.getAttribute(hit.attr) ?? "");
      if (hit.el.getAttribute(hit.attr) !== text) hit.el.setAttribute(hit.attr, text);
    }
  }

  private revert(key: string) {
    for (const hit of this.byKey.get(key) ?? []) {
      if (hit.node) {
        const original = this.originals.get(hit.node);
        if (original !== undefined) {
          hit.node.data = original;
          this.originals.delete(hit.node);
        }
      } else if (hit.attr) {
        const original = this.originals.get(hit.el);
        if (original !== undefined) {
          hit.el.setAttribute(hit.attr, original);
          this.originals.delete(hit.el);
        }
      }
    }
  }

  /* ------------------------------------------------------ selection / hover */

  select(key: string | null, scroll: boolean) {
    this.selected = key;
    this.refreshMarks();
    if (key && scroll) this.scrollTo(key);
    this.scheduleBadge();
  }

  hover(key: string | null) {
    this.hovered = key;
    this.refreshMarks();
    if (key) this.scrollTo(key, true);
  }

  setShowAll(show: boolean) {
    this.doc.documentElement.classList.toggle("txe-all", show);
  }

  private primaryHit(key: string): Hit | undefined {
    const hits = this.byKey.get(key);
    return hits?.find((hit) => hit.visible) ?? hits?.[0];
  }

  private scrollTo(key: string, onlyIfOffscreen = false) {
    const hit = this.primaryHit(key);
    if (!hit || !hit.visible) return;
    const rect = hit.el.getBoundingClientRect();
    const height = this.doc.defaultView!.innerHeight;
    const fullyVisible = rect.top >= 60 && rect.bottom <= height - 20;
    if (onlyIfOffscreen && fullyVisible) return;
    hit.el.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  private refreshMarks() {
    const dirty = new Set(Object.keys(this.drafts));
    for (const [el, hits] of this.byElement) {
      const states: string[] = [];
      const keys = hits.flatMap((hit) => hit.keys);
      if (this.selected && keys.includes(this.selected)) states.push("selected");
      if (this.hovered && keys.includes(this.hovered)) states.push("hover");
      if (keys.some((key) => dirty.has(key))) states.push("dirty");
      if (states.length > 0) el.setAttribute("data-txe-state", states.join(" "));
      else el.removeAttribute("data-txe-state");
    }
  }

  private scheduleBadge = () => {
    if (this.badgeFrame !== undefined) return;
    this.badgeFrame = window.requestAnimationFrame(() => {
      this.badgeFrame = undefined;
      this.positionBadge();
    });
  };

  private positionBadge() {
    const hit = this.selected ? this.primaryHit(this.selected) : undefined;
    if (!hit || !hit.visible) {
      this.badge.style.display = "none";
      return;
    }
    const view = this.doc.defaultView!;
    const rect = hit.el.getBoundingClientRect();
    const above = rect.top - 24 >= 0;
    this.badge.style.display = "block";
    this.badge.style.left = `${Math.max(4, rect.left + view.scrollX)}px`;
    this.badge.style.top = `${above ? rect.top + view.scrollY - 24 : rect.bottom + view.scrollY + 4}px`;
    this.badge.style.borderRadius = above ? "6px 6px 6px 0" : "0 6px 6px 6px";
    this.observer.takeRecords();
  }

  /* --------------------------------------------------------------- events */

  private hitElementFor(target: EventTarget | null): HTMLElement | null {
    for (let el = isElement(target) ? target : null; el; el = el.parentElement) {
      if (this.byElement.has(el)) return el;
    }
    return null;
  }

  private handleClick = (event: MouseEvent) => {
    const target = isElement(event.target) ? event.target : null;
    const hitEl = this.hitElementFor(event.target);
    if (hitEl) {
      const hits = this.byElement.get(hitEl)!;
      this.callbacks.onSelect(hits[0].keys[0]);
    }
    // The preview is for editing, not browsing: never leave the page or submit forms.
    if (target?.closest("a[href], button[type=submit], input[type=submit]")) event.preventDefault();
  };

  private handleSubmit = (event: Event) => event.preventDefault();

  private handleOver = (event: MouseEvent) => {
    const hitEl = this.hitElementFor(event.target);
    const key = hitEl ? this.byElement.get(hitEl)![0].keys[0] : null;
    if (key !== this.lastHoverReported) {
      this.lastHoverReported = key;
      this.callbacks.onHover(key);
    }
  };

  private handleLeave = (event: MouseEvent) => {
    if (event.target === this.doc.documentElement || event.target === this.doc.body) {
      this.lastHoverReported = null;
      this.callbacks.onHover(null);
    }
  };

  /* -------------------------------------------------------------- cleanup */

  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.rescanTimer);
    if (this.badgeFrame !== undefined) window.cancelAnimationFrame(this.badgeFrame);
    this.observer.disconnect();
    const view = this.doc.defaultView;
    this.doc.removeEventListener("click", this.handleClick, true);
    this.doc.removeEventListener("submit", this.handleSubmit, true);
    this.doc.removeEventListener("mouseover", this.handleOver, true);
    this.doc.removeEventListener("mouseleave", this.handleLeave, true);
    view?.removeEventListener("scroll", this.scheduleBadge);
    view?.removeEventListener("resize", this.scheduleBadge);
    try {
      for (const el of this.byElement.keys()) {
        el.removeAttribute("data-txe");
        el.removeAttribute("data-txe-state");
      }
      this.doc.documentElement.classList.remove("txe-all");
      this.styleEl.remove();
      this.badge.remove();
    } catch {
      // The iframe document may already be gone (navigation/unmount) — nothing left to clean.
    }
  }
}
