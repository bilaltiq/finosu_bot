import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

function parseEmailRecipients(value?: string) {
    return value
        ?.split(",")
        .map((email) => email.trim())
        .filter(Boolean)
}

export async function sendSummaryEmail(summary: string) {
    const to = parseEmailRecipients(process.env.SUMMARY_EMAIL_TO);
    const from = process.env.SUMMARY_EMAIL_FROM;

    if (!process.env.RESEND_API_KEY) {
        throw new Error("Missin env var RESEND_API_KEY")
    }

    if (!to?.length || !from) {
        throw new Error("Missing env var of summary to or summary from")
    }

    const res = await resend.emails.send({
        from,
        to,
        subject: "New Client Intake Summary",
        text: summary
    })

    if (res.error) {
        throw new Error(res.error.message)
    }

    return res.data

}