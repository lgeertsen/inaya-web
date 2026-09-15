import { google, calendar_v3 } from "googleapis";

let calendarClient: calendar_v3.Calendar | null = null;

// Lazily constructed so importing this module (e.g. during `next build`'s
// route analysis) never requires the service account credentials to be set —
// only calling a route handler that actually talks to Google Calendar does.
function getCalendarClient(): calendar_v3.Calendar {
  if (!calendarClient) {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if (!email || !key) {
      throw new Error("Google service account credentials are not set");
    }
    const auth = new google.auth.JWT({
      email,
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    calendarClient = google.calendar({ version: "v3", auth });
  }
  return calendarClient;
}

function getCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID is not set");
  return calendarId;
}

function getVaccineCalendarId(): string {
  const calendarId = process.env.GOOGLE_VACCINE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_VACCINE_CALENDAR_ID is not set");
  return calendarId;
}

// All-day Google Calendar events use an exclusive end date, so a one-day
// reminder needs start = date and end = date + 1 day. Pure string/UTC
// arithmetic (same reasoning as computeVisitEndAt in lib/vet-visits.ts)
// avoids the server process's local timezone shifting a "YYYY-MM-DD" date.
function addOneDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export interface CalendarEventInput {
  reason: string;
  scheduledAt: string;
  endAt: string;
  animalNames: string[];
}

function toEventBody(visit: CalendarEventInput): calendar_v3.Schema$Event {
  return {
    summary: visit.reason,
    description:
      visit.animalNames.length > 0 ? `Animaux : ${visit.animalNames.join(", ")}` : undefined,
    start: { dateTime: visit.scheduledAt },
    end: { dateTime: visit.endAt },
  };
}

export async function createCalendarEvent(visit: CalendarEventInput): Promise<string> {
  const { data } = await getCalendarClient().events.insert({
    calendarId: getCalendarId(),
    requestBody: toEventBody(visit),
  });
  if (!data.id) throw new Error("Google Calendar did not return an event id");
  return data.id;
}

export async function updateCalendarEvent(
  eventId: string,
  visit: CalendarEventInput,
): Promise<void> {
  await getCalendarClient().events.update({
    calendarId: getCalendarId(),
    eventId,
    requestBody: toEventBody(visit),
  });
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    await getCalendarClient().events.delete({ calendarId: getCalendarId(), eventId });
  } catch (error) {
    // Already gone (e.g. deleted directly in Google Calendar) — not an error
    // for our purposes, the visit row is still being removed either way.
    const status = (error as { code?: number }).code;
    if (status !== 404 && status !== 410) throw error;
  }
}

// Vaccine follow-up reminders: a date-only (no time) event on the separate
// "Vaccins" calendar.
export interface VaccineReminderInput {
  animalName: string;
  vaccineName: string;
  date: string;
}

function toReminderEventBody(reminder: VaccineReminderInput): calendar_v3.Schema$Event {
  return {
    summary: `${reminder.animalName} – ${reminder.vaccineName}`,
    start: { date: reminder.date },
    end: { date: addOneDay(reminder.date) },
  };
}

export async function createVaccineReminderEvent(reminder: VaccineReminderInput): Promise<string> {
  const { data } = await getCalendarClient().events.insert({
    calendarId: getVaccineCalendarId(),
    requestBody: toReminderEventBody(reminder),
  });
  if (!data.id) throw new Error("Google Calendar did not return an event id");
  return data.id;
}

export async function updateVaccineReminderEvent(
  eventId: string,
  reminder: VaccineReminderInput,
): Promise<void> {
  await getCalendarClient().events.update({
    calendarId: getVaccineCalendarId(),
    eventId,
    requestBody: toReminderEventBody(reminder),
  });
}

export async function deleteVaccineReminderEvent(eventId: string): Promise<void> {
  try {
    await getCalendarClient().events.delete({ calendarId: getVaccineCalendarId(), eventId });
  } catch (error) {
    const status = (error as { code?: number }).code;
    if (status !== 404 && status !== 410) throw error;
  }
}
