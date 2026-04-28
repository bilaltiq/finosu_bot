import { NextResponse } from "next/server"
import { intakeSchema } from "@/lib/intakeSchema"
import { formatIntakeSummary } from "@/lib/formatSummary"
import { sendSummaryEmail } from "@/lib/email"

export async function POST(request: Request) {
    
    try {
        const body = await request.json()
        const info_parsed = intakeSchema.safeParse(body)

        if (!info_parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid intake data",
                    details: info_parsed.error.flatten()
                },
                { status: 400 }
            )
        }


        const summary = formatIntakeSummary(info_parsed.data)
        
        await sendSummaryEmail(summary)

        return NextResponse.json({
            success: true,
            message: "Summary email send successfully",
            summary
        })
    } catch (error) {
        console.error("Submit intake error:", error)

        return NextResponse.json({
            error: "Failed to submit intake."
        },
        { status: 500 }
    )
    }

}