import { z } from "zod";

export const intakeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  birthday: z.string().min(1, "Birthday is required"),
  smsNumber: z.string().optional(),


  lastSSN: z.string().regex(/^\d{4}$/, "Last four of SSN must be exactly 4 digits"),

  bankRoutingNumber: z.string().regex(/^\d{9}$/, "Routing number must be exactly 9 digits"),
  bankAccountNumber: z.string().min(4, "Account number is required"),
  accountType: z.enum(["checking", "savings"]),

  streetAddress1: z.string().min(1, "Street Address 1 is required"),
  streetAddress2: z.string().optional(),

  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Valid ZIP code is required"),

  employmentStatus: z.string().min(1, "Employment status is required"),
  employerName: z.string().min(1, "Employer name is required"),
  employerDepartment: z.string().optional(),

  payFrequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly"]),

  payFrequencyDay: z.string().min(1, "Pay Frequency Day is required"),
  specificDay: z.string().min(1, "Specific Day is required"),

  salaryOver2000Monthly: z.boolean(),

  employerAddress: z.string().min(1, "Employer Address is required"),
  employerPhoneNumber: z.string().min(7, "Employer phone is required"),

  onFinancialAssistance: z.boolean(),
  deployedMilitary: z.boolean()
});

export type IntakeForm = z.infer<typeof intakeSchema>;