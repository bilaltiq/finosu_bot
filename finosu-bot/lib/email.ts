import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendSummaryEmail(summary: string) {
    const to = process.env.SUMMARY_EMAIL_TO;
    const from = process.env.SUMMARY_EMAIL_FROM;

    if (!to || !from) {
        throw new Error("Missing env var of summary to or summary from")
    }

    const res = await resend.emails.send({
        from,
        to,
        subject: "New Client Intake Summary",
        text: summary
    })

    return res

}