import { jsPDF } from "jspdf";
import autoTable, { type CellDef, type RowInput } from "jspdf-autotable";
import {
  INTAKE_CAUSES,
  OUTCOME_CAUSES,
  REGISTER_SPECIES,
  type RegisterAge,
  type RegisterData,
  type RegisterEntry,
  type RegisterExit,
  type RegisterSpecies,
} from "./register";

/** Translator over the `admin.register` namespace (the PDF is always French). */
export type RegisterTranslator = (key: string, values?: Record<string, string | number>) => string;

const MARGIN = 10;
const FONT_SIZE = 7;
const HEAD_FILL: [number, number, number] = [226, 232, 240];
const ENTRY_FILL: [number, number, number] = [250, 219, 219];
const EXIT_FILL: [number, number, number] = [206, 230, 200];
const TOTAL_FILL: [number, number, number] = [238, 238, 238];

/** yyyy-mm-dd -> dd/mm/yyyy */
export function formatRegisterDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatAge(age: RegisterAge | null, t: RegisterTranslator): string {
  return age ? t(`age.${age.unit}`, { count: age.count }) : "";
}

function sexLabel(sex: RegisterEntry["sex"], t: RegisterTranslator): string {
  return t(`sex.${sex}`);
}

function lastTableY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? MARGIN;
}

const headCell = (content: string, extra: Partial<CellDef> = {}): CellDef => ({
  content,
  styles: { halign: "center", valign: "middle", fontStyle: "bold" },
  ...extra,
});

function addSummary(doc: jsPDF, data: RegisterData, t: RegisterTranslator) {
  const { summary } = data;
  const speciesName = (s: RegisterSpecies) => t(`speciesNames.${s}`);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(t("pdfTitle", { year: data.year }), MARGIN, MARGIN + 4);

  const baseStyles = { fontSize: FONT_SIZE + 1, cellPadding: 1.6, lineColor: [120, 120, 120] as [number, number, number], lineWidth: 0.15 };

  // Entrées ------------------------------------------------------------------
  const entryTotals = INTAKE_CAUSES.map((c) => summary.entries.reduce((sum, r) => sum + r.counts[c], 0));
  autoTable(doc, {
    startY: MARGIN + 9,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: baseStyles,
    headStyles: { fillColor: ENTRY_FILL, textColor: 0 },
    head: [[t("entriesTitle"), ...INTAKE_CAUSES.map((c) => t(`intakeCauses.${c}`)), t("total")]],
    body: [
      ...summary.entries.map((row) => [
        { content: speciesName(row.species), styles: { fontStyle: "bold" as const } },
        ...INTAKE_CAUSES.map((c) => String(row.counts[c])),
        { content: String(row.total), styles: { fontStyle: "bold" as const } },
      ]),
      [
        { content: t("total"), styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL } },
        ...entryTotals.map((n) => ({ content: String(n), styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL } })),
        {
          content: String(entryTotals.reduce((a, b) => a + b, 0)),
          styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL },
        },
      ],
    ],
    columnStyles: { 0: { cellWidth: 38 } },
  });

  // Sorties ------------------------------------------------------------------
  const exitTotals = OUTCOME_CAUSES.map((c) => summary.exits.reduce((sum, r) => sum + r.counts[c], 0));
  autoTable(doc, {
    startY: lastTableY(doc) + 8,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: baseStyles,
    headStyles: { fillColor: EXIT_FILL, textColor: 0 },
    head: [[t("exitsTitle"), ...OUTCOME_CAUSES.map((c) => t(`outcomeCauses.${c}`)), t("total")]],
    body: [
      ...summary.exits.map((row) => [
        { content: speciesName(row.species), styles: { fontStyle: "bold" as const } },
        ...OUTCOME_CAUSES.map((c) => String(row.counts[c])),
        { content: String(row.total), styles: { fontStyle: "bold" as const } },
      ]),
      [
        { content: t("total"), styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL } },
        ...exitTotals.map((n) => ({ content: String(n), styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL } })),
        {
          content: String(exitTotals.reduce((a, b) => a + b, 0)),
          styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL },
        },
      ],
    ],
    columnStyles: { 0: { cellWidth: 38 } },
  });

  // Présents -----------------------------------------------------------------
  autoTable(doc, {
    startY: lastTableY(doc) + 8,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: 38 + 38 * 2,
    theme: "grid",
    styles: baseStyles,
    headStyles: { fillColor: HEAD_FILL, textColor: 0 },
    head: [
      [
        t("species"),
        t("presentAt", { date: formatRegisterDate(summary.startDate) }),
        summary.endIsToday ? t("today") : t("presentAt", { date: formatRegisterDate(summary.endDate) }),
      ],
    ],
    body: [
      ...summary.present.map((row) => [
        { content: speciesName(row.species), styles: { fontStyle: "bold" as const } },
        String(row.start),
        String(row.end),
      ]),
      [
        { content: t("total"), styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL } },
        {
          content: String(summary.present.reduce((a, r) => a + r.start, 0)),
          styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL },
        },
        {
          content: String(summary.present.reduce((a, r) => a + r.end, 0)),
          styles: { fontStyle: "bold" as const, fillColor: TOTAL_FILL },
        },
      ],
    ],
    columnStyles: { 0: { cellWidth: 38 } },
  });
}

function addEntriesSection(doc: jsPDF, rows: RegisterEntry[], species: RegisterSpecies, data: RegisterData, t: RegisterTranslator) {
  doc.addPage();
  const heading = t("entriesHeading", { species: t(`speciesNames.${species}`).toUpperCase(), year: data.year });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(heading, MARGIN, MARGIN + 3);

  const head: RowInput[] = [
    [
      headCell(t("columns.date"), { rowSpan: 2 }),
      headCell(t("columns.age"), { rowSpan: 2 }),
      headCell(t("columns.sex"), { rowSpan: 2 }),
      headCell(t("columns.name"), { rowSpan: 2 }),
      headCell(t("columns.identification"), { rowSpan: 2 }),
      headCell(t("columns.cause"), { rowSpan: 2 }),
      headCell(t("columns.detail"), { rowSpan: 2 }),
      headCell(t("columns.provenance"), { colSpan: 3 }),
      headCell(t("columns.documentRef"), { rowSpan: 2 }),
    ],
    [headCell(t("columns.contactName")), headCell(t("columns.phone")), headCell(t("columns.address"))],
  ];

  autoTable(doc, {
    startY: MARGIN + 6,
    margin: { left: MARGIN, right: MARGIN, bottom: 12 },
    theme: "grid",
    styles: { fontSize: FONT_SIZE, cellPadding: 1, overflow: "linebreak", lineColor: [150, 150, 150], lineWidth: 0.1 },
    headStyles: { fillColor: ENTRY_FILL, textColor: 0 },
    showHead: "everyPage",
    head,
    body: rows.map((r) => [
      formatRegisterDate(r.date),
      formatAge(r.age, t),
      sexLabel(r.sex, t),
      r.name,
      r.identification ?? "",
      t(`intakeCauses.${r.cause}`),
      r.detail ?? "",
      r.contactName ?? "",
      r.contactPhone ?? "",
      r.contactAddress ?? "",
      r.documentRef ?? "",
    ]),
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 13 },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 26 },
      4: { cellWidth: 30 },
      5: { cellWidth: 24 },
      6: { cellWidth: 46 },
      7: { cellWidth: 30 },
      8: { cellWidth: 22 },
      9: { cellWidth: "auto" },
      10: { cellWidth: 18 },
    },
  });
}

function addExitsSection(doc: jsPDF, rows: RegisterExit[], species: RegisterSpecies, data: RegisterData, t: RegisterTranslator) {
  doc.addPage();
  const heading = t("exitsHeading", { species: t(`speciesNames.${species}`).toUpperCase(), year: data.year });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(heading, MARGIN, MARGIN + 3);

  const head: RowInput[] = [
    [
      headCell(t("columns.date"), { rowSpan: 2 }),
      headCell(t("columns.name"), { rowSpan: 2 }),
      headCell(t("columns.sex"), { rowSpan: 2 }),
      headCell(t("columns.identification"), { rowSpan: 2 }),
      headCell(t("columns.cause"), { rowSpan: 2 }),
      headCell(t("columns.detail"), { rowSpan: 2 }),
      headCell(t("columns.recipient"), { colSpan: 3 }),
      headCell(t("columns.documentRef"), { rowSpan: 2 }),
    ],
    [headCell(t("columns.contactName")), headCell(t("columns.phone")), headCell(t("columns.address"))],
  ];

  autoTable(doc, {
    startY: MARGIN + 6,
    margin: { left: MARGIN, right: MARGIN, bottom: 12 },
    theme: "grid",
    styles: { fontSize: FONT_SIZE, cellPadding: 1, overflow: "linebreak", lineColor: [150, 150, 150], lineWidth: 0.1 },
    headStyles: { fillColor: EXIT_FILL, textColor: 0 },
    showHead: "everyPage",
    head,
    body: rows.map((r) => [
      formatRegisterDate(r.date),
      r.name,
      sexLabel(r.sex, t),
      r.identification ?? "",
      t(`outcomeCauses.${r.cause}`),
      r.detail ?? "",
      r.contactName ?? "",
      r.contactPhone ?? "",
      r.contactAddress ?? "",
      r.documentRef ?? "",
    ]),
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 28 },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 30 },
      4: { cellWidth: 28 },
      5: { cellWidth: 40 },
      6: { cellWidth: 30 },
      7: { cellWidth: 22 },
      8: { cellWidth: "auto" },
      9: { cellWidth: 18 },
    },
  });
}

/** Renders the yearly entries/exits register: a summary page, then ENTREES / SORTIES lists per species. */
export function renderRegisterPdf(data: RegisterData, t: RegisterTranslator, generatedOn: Date = new Date()): Uint8Array {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

  addSummary(doc, data, t);

  for (const species of REGISTER_SPECIES) {
    const entries = data.entries.filter((e) => e.species === species);
    if (entries.length > 0) addEntriesSection(doc, entries, species, data, t);
  }
  for (const species of REGISTER_SPECIES) {
    const exits = data.exits.filter((e) => e.species === species);
    if (exits.length > 0) addExitsSection(doc, exits, species, data, t);
  }

  // Footer on every page, once the page count is known.
  const pages = doc.getNumberOfPages();
  const generated = t("generatedOn", { date: formatRegisterDate(generatedOn.toISOString()) });
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(110);
    const { width, height } = doc.internal.pageSize;
    doc.text(generated, MARGIN, height - 6);
    doc.text(t("page", { current: page, total: pages }), width - MARGIN, height - 6, { align: "right" });
    doc.setTextColor(0);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
