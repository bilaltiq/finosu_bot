import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { fileURLToPath } from "url"
import {
    cli,
    defineAgent,
    inference,
    llm,
    ServerOptions,
    type JobContext,
    type JobProcess,
    voice
} from "@livekit/agents"
import * as livekit from "@livekit/agents-plugin-livekit"
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
  specificDay?: string;
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
  "specificDay",
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

const intake: IntakeData = {}

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
            const normalized = value.toLowerCase().replace(/\s+/g, "");

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
            if (!value || value.toLowerCase() === "same" || value.toLowerCase() === "n/a") {
                return "";
            }

            return digitsOnly(value);

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
    "specificDay",
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
    specificDay: data.specificDay ?? "N/A",
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
    constructor () {
        super ({
            instructions: `
            
            You will behave like a professional voice assistant for the company Finosu. Your designation is a loan intake assistant.
            
            You will have to collect the required loan intake fields one by one.

            Rules:
            - Ask one question at a time
            - Save each answer using saveField tool
            - For sensitive numeric fields, repeat the value back to the user digit by digit and ask the user to confirm
            - The sensitive fields marked are the lastSSN, bank routing number, bank account number and employer phone number.
            - Never ask for the full social security number
            - Pay frequency must be weekly, biweekly, semimonthly or monthly.
            - Pay frequency day is the payday pattern, i.e every Wednesday or the 1st and 15th.
            - Once all fields collected, call reviewIntake and read a short redacted summary.
            - Only once the user approves, call submitIntake
            - Be calm, professional and concise
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

                    (intake as Record<string, unknown>)[field] = normalized;

                    const missingFields = getMissingFields(intake)

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
                            missingFields: getMissingFields(intake),
                            summary: buildReviewSummary(intake)
                        }
                    }
                }),

                submitIntake: llm.tool({
                    description: "Submit the completed intake after user approval of final review",
                    parameters: z.object({}),
                    execute: async () => {
                        const missingFields = getMissingFields(intake)
                        if (missingFields.length > 0){
                            throw new llm.ToolError(
                                `Cannot submit yet. The missing fields are: ${missingFields.join(", ")}`
                            )
                        }

                        const result = await submitIntakeToBackend(intake)

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
      stt: "deepgram/nova-3:multi",
      llm: "openai/gpt-4.1-mini",
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      turnHandling: {
        turnDetection: new livekit.turnDetector.MultilingualModel(),
      },
    });

    await ctx.connect();

    await session.start({
      room: ctx.room,
      agent: new LoanIntakeAgent(),
      record: false,
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