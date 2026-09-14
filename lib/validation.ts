import { z } from "zod";

export const animalSpeciesSchema = z.enum(["cat", "dog", "horse", "goat", "other"]);
export const animalTrackSchema = z.enum(["adoption", "sponsorship"]);
export const animalStatusSchema = z.enum(["available", "pending", "adopted"]);
export const animalSexSchema = z.enum(["male", "female", "unknown"]);

export const animalFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  species: animalSpeciesSchema,
  track: animalTrackSchema,
  status: animalStatusSchema,
  breed: z.string().trim().optional().nullable(),
  sex: animalSexSchema,
  birthYear: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  birthMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  size: z.string().trim().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
  bioFr: z.string().optional().nullable(),
  bioEn: z.string().optional().nullable(),
  specialNeeds: z.boolean(),
  isPublished: z.boolean(),
});

// Output type (after zod coercion/defaults) — what API routes receive once
// `safeParse` succeeds, and what lib/animals.ts functions expect.
export type AnimalFormValues = z.infer<typeof animalFormSchema>;
// Input type (before coercion) — what react-hook-form's raw field state holds,
// since number fields start as strings before zod coerces them on submit.
export type AnimalFormInput = z.input<typeof animalFormSchema>;

export const donateCheckoutSchema = z.object({
  amount: z.coerce.number().int().min(1, "Minimum 1€").max(10000),
  frequency: z.enum(["one_time", "monthly"]),
  animalId: z.string().uuid().optional(),
  locale: z.enum(["fr", "en"]),
});

export type DonateCheckoutValues = z.infer<typeof donateCheckoutSchema>;

// Internal shelter-operations schemas (admin-only) --------------------------

export const animalIntakeReasonSchema = z.enum([
  "stray",
  "police_surrender",
  "born_in_care",
  "shelter_transfer",
  "association_transfer",
  "owner_surrender",
  "abandoned",
  "cruelty_seizure",
]);

export const animalOutcomeReasonSchema = z.enum([
  "reunited_with_owner",
  "deceased",
  "euthanized",
  "released",
  "transferred_to_association",
  "adopted",
]);

export const treatmentMeasurementUnitSchema = z.enum(["pill", "spoon", "ml", "cl"]);
export const vetAppointmentStatusSchema = z.enum(["pending", "completed", "canceled"]);

export const animalInternalDetailsFormSchema = z.object({
  microchipNumber: z.string().trim().optional().nullable(),
  coat: z.string().trim().optional().nullable(),
  birthDate: z.string().optional().nullable(),
});

export type AnimalInternalDetailsFormValues = z.infer<typeof animalInternalDetailsFormSchema>;

export const animalIntakeFormSchema = z.object({
  occurredOn: z.string().min(1, "Date is required"),
  reason: animalIntakeReasonSchema,
  description: z.string().trim().optional().nullable(),
});

export type AnimalIntakeFormValues = z.infer<typeof animalIntakeFormSchema>;

export const animalOutcomeFormSchema = z.object({
  occurredOn: z.string().min(1, "Date is required"),
  reason: animalOutcomeReasonSchema,
  description: z.string().trim().optional().nullable(),
});

export type AnimalOutcomeFormValues = z.infer<typeof animalOutcomeFormSchema>;

export const animalVaccineFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  administeredOn: z.string().min(1, "Date is required"),
  followUpDate: z.string().optional().nullable(),
  followUpCompleted: z.boolean(),
});

export type AnimalVaccineFormValues = z.infer<typeof animalVaccineFormSchema>;
export type AnimalVaccineFormInput = z.input<typeof animalVaccineFormSchema>;

export const animalTreatmentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  medicine: z.string().trim().min(1, "Medicine is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  step: z.coerce.number().int().min(1),
  amount: z.coerce.number().positive(),
  measurement: treatmentMeasurementUnitSchema,
  dayStep: z.coerce.number().int().optional().nullable(),
  dayTimes: z.coerce.number().int().optional().nullable(),
});

export type AnimalTreatmentFormValues = z.infer<typeof animalTreatmentFormSchema>;
export type AnimalTreatmentFormInput = z.input<typeof animalTreatmentFormSchema>;

export const animalVetAppointmentFormSchema = z.object({
  scheduledAt: z.string().min(1, "Date/time is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  status: vetAppointmentStatusSchema,
  followUpDate: z.string().optional().nullable(),
  followUpCompleted: z.boolean(),
});

export type AnimalVetAppointmentFormValues = z.infer<typeof animalVetAppointmentFormSchema>;

export const contactFormSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
