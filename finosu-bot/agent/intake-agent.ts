import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { fileURLToPath } from "url"
import {
    cli,
    defineAgent,
    llm,
    ServerOptions,
    type JobContext,
    type JobProcess,
    voice
} from "@livekit/agents"
import * as silero from "@livekit/agents-plugin-silero"
import { z } from "zod"

type IntakeData = {
  name?: string;
  email?: string;
  birthday?: string;
  smsNumberIfDifferent?: string;
  lastSSN?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  accountType?: "checking" | "savings";
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  zip?: string;
  employmentStatus?: string;
  employerName?: string;
  employerDepartment?: string;
  payFrequency?: "weekly" | "biweekly" | "semimonthly" | "monthly";
  payFrequencyDay?: string;
  salaryOver2000Monthly?: boolean;
  employerAddress?: string;
  employerPhoneNumber?: string;
  onFinancialAssistance?: boolean;
  deployedMilitary?: boolean;
};

const FIELD_NAMES = [
    "name",
  "email",
  "birthday",
  "smsNumberIfDifferent",
  "lastSSN",
  "bankRoutingNumber",
  "bankAccountNumber",
  "accountType",
  "streetAddress1",
  "streetAddress2",
  "city",
  "state",
  "zip",
  "employmentStatus",
  "employerName",
  "employerDepartment",
  "payFrequency",
  "payFrequencyDay",
  "salaryOver2000Monthly",
  "employerAddress",
  "employerPhoneNumber",
  "onFinancialAssistance",
  "deployedMilitary",
] as const

type FieldName = (typeof FIELD_NAMES)[number]

const SENSITIVE_FIELDS = new Set<FieldName>([
    "lastSSN",
    "bankRoutingNumber",
    "bankAccountNumber",
    "employerPhoneNumber"
])

function digitsOnly(value: string) {
    return value.replace(/\D/g, "")
} 

function parseBoolean(value: string): boolean {
    const normalized = value.trim().toLowerCase()

    if (["yes", "y", "yeah", "yep", "true"].includes(normalized)){
        return true
    }

    if (["no", "nope", "n", "false", "nah"].includes(normalized)){
        return false
    }

    throw new llm.ToolError("Please answer with a yes or a no.")
}

function normalizeBirthday(value: string) {
    const trimmed = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed
    }

    const parsed = new Date(trimmed)

    if (Number.isNaN(parsed.getTime())) {
        throw new llm.ToolError(
            "Please provide a valid date, such as Jan 12 2003"
        )
    }

    return parsed.toISOString().slice(0,10)
}

function normalizeSpokenEmail(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/\bat\b/g, "@")
        .replace(/\bdot\b/g, ".")
        .replace(/\s+/g, "");
}

function redactDigits(value?: string, visible = 4) {
    if (!value) return "N/A"

    const digits = digitsOnly(value)

    if (!digits) return value

    if (digits.length <= visible) {
        return `${"*".repeat(Math.max(0, digits.length - 1))}${digits.slice(-1)}`;
    }

    return `${"*".repeat(digits.length - visible)}${digits.slice(-visible)}`;
}

function normalizeIntakeField(field: FieldName, rawValue: string): string | boolean {


    const value = rawValue.trim()

    switch(field){
        case "email": {
            const normalized = normalizeSpokenEmail(value)

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
                throw new llm.ToolError("That email address does not look valid.");
            }

            return normalized;            
        }

        case "birthday": {
            return normalizeBirthday(value);
        }

        case "lastSSN": {
            const digits = digitsOnly(value);

            if (!/^\d{4}$/.test(digits)) {
                throw new llm.ToolError("Last four of SSN must be exactly 4 digits.");
            }

            return digits;    
        }

        case "bankRoutingNumber": {
            const digits = digitsOnly(value);

            if (!/^\d{9}$/.test(digits)) {
                throw new llm.ToolError("Routing number must be exactly 9 digits.");
            }

            return digits;
        }

        case "bankAccountNumber": {
            const digits = digitsOnly(value);

            if (digits.length < 4 || digits.length > 17) {
                throw new llm.ToolError(
                "Bank account number should be between 4 and 17 digits."
                );
            }

            return digits;
        }

        case "accountType": {
            const normalized = value.toLowerCase()

            if (normalized !== "checking" && normalized !== "savings"){
                throw new llm.ToolError("Please specify account as checking or savings")
            }

            return normalized
        }

        case "state": {
            const normalized = value.toUpperCase();

            if (!/^[A-Z]{2}$/.test(normalized)) {
                throw new llm.ToolError("Please provide the two-letter state abbreviation.");
            }

            return normalized;
        }

        case "zip": {
            if (!/^\d{5}(-\d{4})?$/.test(value)) {
                throw new llm.ToolError("ZIP code must be 5 digits or ZIP+4.");
            }

            return value;
        }

        case "payFrequency": {
            const normalized = value.toLowerCase().replace(/\s+/g, "");

            if (
                !["weekly", "biweekly", "semimonthly", "monthly"].includes(normalized)
            ) {
                throw new llm.ToolError(
                "Pay frequency must be weekly, biweekly, semimonthly, or monthly."
                );
            }

            return normalized;
        }

        case "salaryOver2000Monthly":
        case "onFinancialAssistance":
        case "deployedMilitary":
            return parseBoolean(value)

        
        case "smsNumberIfDifferent": {

            const normalized = value.trim().toLowerCase()

            if (
                !normalized ||
                normalized === "same" ||
                normalized === "n/a" ||
                normalized === "no" ||
                normalized === "none"
            ) {
                return "";
            }

            const digits = digitsOnly(value);

            if (digits.length < 8 || digits.length > 15) {
                throw new llm.ToolError("SMS phone number should be between 8 and 15 digits.")
            }

            return digits;

        }

        case "streetAddress2":
            return value || ""
        
        default:
            return value


    }

}

function getMissingFields(data: IntakeData): FieldName[] {
  const required: FieldName[] = [
    "name",
    "email",
    "birthday",
    "smsNumberIfDifferent",
    "lastSSN",
    "bankRoutingNumber",
    "bankAccountNumber",
    "accountType",
    "streetAddress1",
    "city",
    "state",
    "zip",
    "employmentStatus",
    "employerName",
    "employerDepartment",
    "payFrequency",
    "payFrequencyDay",
    "salaryOver2000Monthly",
    "employerAddress",
    "employerPhoneNumber",
    "onFinancialAssistance",
    "deployedMilitary",
  ];

  return required.filter((field) => {
    const value = data[field];

    if (typeof value === "boolean") {
      return false;
    }

    return value === undefined || value === "";
  });
}

function buildReviewSummary(data: IntakeData) {
  return {
    name: data.name ?? "N/A",
    email: data.email ?? "N/A",
    birthday: data.birthday ?? "N/A",
    smsNumberIfDifferent: data.smsNumberIfDifferent || "N/A",
    lastSSN: redactDigits(data.lastSSN, 1),
    bankRoutingNumber: redactDigits(data.bankRoutingNumber, 4),
    bankAccountNumber: redactDigits(data.bankAccountNumber, 4),
    accountType: data.accountType ?? "N/A",
    streetAddress1: data.streetAddress1 ?? "N/A",
    streetAddress2: data.streetAddress2 || "N/A",
    city: data.city ?? "N/A",
    state: data.state ?? "N/A",
    zip: data.zip ?? "N/A",
    employmentStatus: data.employmentStatus ?? "N/A",
    employerName: data.employerName ?? "N/A",
    employerDepartment: data.employerDepartment ?? "N/A",
    payFrequency: data.payFrequency ?? "N/A",
    payFrequencyDay: data.payFrequencyDay ?? "N/A",
    salaryOver2000Monthly:
      data.salaryOver2000Monthly === undefined
        ? "N/A"
        : data.salaryOver2000Monthly
          ? "Yes"
          : "No",
    employerAddress: data.employerAddress ?? "N/A",
    employerPhoneNumber: redactDigits(data.employerPhoneNumber, 4),
    onFinancialAssistance:
      data.onFinancialAssistance === undefined
        ? "N/A"
        : data.onFinancialAssistance
          ? "Yes"
          : "No",
    deployedMilitary:
      data.deployedMilitary === undefined
        ? "N/A"
        : data.deployedMilitary
          ? "Yes"
          : "No",
  };
}

// ============================================= ASYNC API CALL

async function submitIntakeToBackend(data: IntakeData) {
    const url = process.env.INTAKE_SUBMIT_URL

    if (!url) {
        throw new llm.ToolError("Missing env variable INTAKE_SUBMIT_URL")
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            smsNumberIfDifferent: "",
            streetAddress2: "",
            ...data,
        }),
    })

    const text = await response.text()

    if (!response.ok) {
        throw new llm.ToolError(`Backend submission has failed: ${text}`)
    }

    try {
        return JSON.parse(text)
    } catch {
        return { ok: true, raw: text}
    }
}

// ============================================= Agent class

class LoanIntakeAgent extends voice.Agent {

    private intake: IntakeData = {}

    constructor () {
        super ({
            instructions: `
            
            You will behave like a professional voice assistant for the company Finosu. Your designation is a loan intake assistant.
            
            You will have to collect the required loan intake fields one by one. Do not let the user skip to another field unless they have answered the current one.

            Core behaviour:
            - Ask one question at a time, waiting for the user to respond.
            - Keep questions short and clear.
            - Do not rush the applicant.
            - Do not guess, infer or fabricate field values.
            - If the applicant gives an unclear answer, ask them to repeat or spell it.
            - Save a field only after you are confident which field the answer belongs to.

            Confirmation rules:
            - For high-risk fields, repeat the captured value back and ask for confirmation BEFORE calling saveField.
            - High risk fields are: name, email, lastSSN, bankRoutingNumber, bankAccountNumber, employerName, employerPhoneNumber, payFrequency.
            - For lower-risk fields, you may save directly unless the answer is unclear.

            Sensitive numeric fields:
            - Sensitive numeric fields are lastSSN, bankRoutingNumber, bankAccountNumber and employerPhoneNumber.
            - Never ask for the full social security number.
            - For sensitive numeric fields, repeat the value back digit by digit before saving.
            - Do not say full bank account or routing numbers in the final review. Only use redacted values from reviewIntake.

            Email handling:
            - Ask the applicant to spell their email slowly.
            - Convert spoken email formats like "at" and "dot" into @ and .
            - Repeat the email back clearly before saving
            - If unsure, ask them to spell it again.

            SMS Handling:
            - After collecting email, ask: "Would you like to provide a different phone number for SMS updates?"
            - If no, save smsNumberIfDifferent as an empty string.
            - If yes, ask for the SMS number, repeat it digit by digit, confirm it and then save smsNumberIfDifferent.
            - In the final review, show an empty smsNumberIfDifferent as N/A.

            Name handling:
            - Ask for the full legal name.
            - Repeat the full legal name back. If the name is uncommon, unclear, short or corrected by the applicant, ask them to spell it and then confirm the spelling before saving.
            - Do not change, shorten or autocorrect the name unless the applicant confirms.

            Pay schedule handling:
            - Pay frequency MUST be weekly, biweekly, semimonthly or monthly.
            - After payFrequency is collected, ask only the payday detail that applies:
                - weekly: ask what weekday they are paid
                - biweekly: ask what weekday they are paid, and ask for the next payday if needed
                - semimonthly: ask which two days of the month they are paid, for example the 1st and the 15th
                - monthly: ask which day of the month they are paid, for example the 3rd or last business day
            - Do not duplicate payday questions.

            Tool usage:
            - Use saveField to save one field at a time.
            - For high-risk fields, call saveField only after the applicant confirms.
            - After each saveField result, use nextSuggestedField to decide what to ask next.
            - If saveField returns a validation error, politely ask the applicant for that field again.
            - Once all fields are collected, call reviewIntake and read a short redacted summary.
            - Only after the applicant clearly approves the review summary, call submitIntake.

            Final Review:
            - Keep the review precise and very short.
            - Use redacted values for SSN, routing number, bank account number.
            - Ask: "Is everything correct and shall I submit"
            - If the applicant corrects any field during review, save the corrected value, call reviewIntake again and ask for approval again before submitting.

            Tonality:
            - Be calm, professional and concise.
            - Avoid long explanations.
            - If there is silence or confusion for a while briefly restate the question.

            If the applicant answers a different question than the one asked, do not force the answer into the current field. Clarify what they meant before saving.
            
            `,
            tools: {
                saveField: llm.tool({
                    description: "Save one normalized intake field",
                    parameters: z.object({
                        field: z.enum(FIELD_NAMES),
                        value: z.string()
                    }),
                execute: async({ field, value }) => {
                    const normalized = normalizeIntakeField(field, value);

                    (this.intake as Record<string, unknown>)[field] = normalized;

                    const missingFields = getMissingFields(this.intake)

                    return {
                        savedField: field,
                        savedValue: SENSITIVE_FIELDS.has(field)
                        ? redactDigits(String(normalized))
                        : normalized,
                        missingFields,
                        nextSuggestedField: missingFields[0] ?? null
                    }
                }
                }),

                reviewIntake: llm.tool({
                    description:
                    "Return a redacted review summary and list missing fields before final submission",
                    parameters: z.object({}),
                    execute: async () => {
                        return {
                            missingFields: getMissingFields(this.intake),
                            summary: buildReviewSummary(this.intake)
                        }
                    }
                }),

                submitIntake: llm.tool({
                    description: "Submit the completed intake after user approval of final review",
                    parameters: z.object({}),
                    execute: async () => {
                        const missingFields = getMissingFields(this.intake)
                        if (missingFields.length > 0){
                            throw new llm.ToolError(
                                `Cannot submit yet. The missing fields are: ${missingFields.join(", ")}`
                            )
                        }

                        const result = await submitIntakeToBackend(this.intake)

                        return {
                            ok: true,
                            result
                        }

                    },

                    
                }),
            }      
        })
    }


    async onEnter() {
        this.session.generateReply({
            instructions:
            "Briefly greet the applicant, then mention you are going to collect information for their loan applications and ask for their full legal name first."
        })
    }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad as silero.VAD;

    const session = new voice.AgentSession({
      vad,
      stt: "deepgram/nova-3:en",
      llm: "openai/gpt-4.1-mini",
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
    });

    const transcript: Array<{
        role: "user" | "agent";
        text: string;
        ts: string;

    }> = [];

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (event) => {
        if (!event.isFinal) return

        console.log("USER_TRANSCRIPT", {
            room: ctx.room.name,
            text: event.transcript,
            ts: new Date(event.createdAt).toISOString(),
            language: event.language
        })
    })

    await ctx.connect();

    await session.start({
      room: ctx.room,
      agent: new LoanIntakeAgent(),
      record: true,
    });    
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "loan-intake-agent",
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    wsURL: process.env.LIVEKIT_URL,
  })
);