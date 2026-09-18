import { z } from "zod";

export const animalSpeciesSchema = z.enum(["cat", "dog", "horse", "goat", "other"]);
export const animalTrackSchema = z.enum(["adoption", "sponsorship"]);
export const animalSexSchema = z.enum(["male", "female", "unknown"]);

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

export const animalFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  species: animalSpeciesSchema,
  track: animalTrackSchema,
  breed: z.string().trim().optional().nullable(),
  sex: animalSexSchema,
  birthYear: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1990).max(new Date().getFullYear()).optional(),
  ).nullable(),
  birthMonth: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(12).optional(),
  ).nullable(),
  size: z.string().trim().optional().nullable(),
  arrivalDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable(),
  ),
  bioFr: z.string().optional().nullable(),
  bioEn: z.string().optional().nullable(),
  specialNeeds: z.boolean(),
  calicivirus: z.boolean(),
  isPublished: z.boolean(),
});

// Output type (after zod coercion/defaults) — what API routes receive once
// `safeParse` succeeds, and what lib/animals.ts functions expect.
export type AnimalFormValues = z.infer<typeof animalFormSchema>;
// Input type (before coercion) — what react-hook-form's raw field state holds,
// since number fields start as strings before zod coerces them on submit.
export type AnimalFormInput = z.input<typeof animalFormSchema>;

// Client-only: the animal form also collects the microchip number, which
// lives in animal_internal_details (admin-only table), not animals. The
// AnimalForm component splits this back out and sends it to the
// internal-details endpoint separately — it's never part of AnimalFormValues.
export const animalFormWithMicrochipSchema = animalFormSchema.extend({
  microchipNumber: z.string().trim().optional().nullable(),
});
export type AnimalFormWithMicrochipValues = z.infer<typeof animalFormWithMicrochipSchema>;
export type AnimalFormWithMicrochipInput = z.input<typeof animalFormWithMicrochipSchema>;

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

// Vet visits always block exactly one hour (see computeVisitEndAt in
// lib/vet-visits.ts) — there's no end-time input.
export const vetVisitFormSchema = z.object({
  scheduledAt: z.string().min(1, "Date/time is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  status: vetAppointmentStatusSchema,
  animalIds: z.array(z.string().uuid()).min(1, "Select at least one animal"),
});

export type VetVisitFormValues = z.infer<typeof vetVisitFormSchema>;

export const vetVisitAnimalFormSchema = z.object({
  notes: z.string().trim().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  followUpCompleted: z.boolean(),
});

export type VetVisitAnimalFormValues = z.infer<typeof vetVisitAnimalFormSchema>;

export const vetVisitAddAnimalSchema = z.object({
  animalId: z.string().uuid(),
});

// Volunteer accounts (admin-only) --------------------------------------------

export const createVolunteerAccountSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateVolunteerAccountValues = z.infer<typeof createVolunteerAccountSchema>;

// Self-service password change (any signed-in admin or volunteer) --------------

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const contactFormSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

// Public applications (volunteer / foster family) --------------------------

export const volunteerAvailabilitySchema = z.enum([
  "weekday",
  "weekend",
  "occasional",
  "flexible",
]);

export const volunteerApplicationSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  availability: volunteerAvailabilitySchema,
  message: z.string().trim().min(1),
});

export type VolunteerApplicationValues = z.infer<typeof volunteerApplicationSchema>;

export const fosterHousingTypeSchema = z.enum([
  "house_garden",
  "apartment",
  "farm",
  "other",
]);

export const fosterFamilyApplicationSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  city: z.string().trim().min(1),
  housingType: fosterHousingTypeSchema,
  message: z.string().trim().min(1),
});

export type FosterFamilyApplicationValues = z.infer<typeof fosterFamilyApplicationSchema>;
