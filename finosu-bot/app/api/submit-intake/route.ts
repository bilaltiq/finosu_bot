import { NextResponse } from "next/server"
import { intakeSchema } from "@/lib/intakeSchema"
import { formatIntakeSummary } from "@/lib/formatSummary"
import { sendSummaryEmail } from "@/lib/email"
import { pool } from "@/lib/db"

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

        const data = info_parsed.data

        const result = await pool.query(
            `
            INSERT INTO loan_intakes (
                name,
                email,
                birthday,
                sms_number_if_different,
                last_ssn,
                bank_routing_number,
                bank_account_number,
                account_type,
                street_address1,
                street_address2,
                city,
                state,
                zip,
                employment_status,
                employer_name,
                employer_department,
                pay_frequency,
                pay_frequency_day,
                salary_over_2000_monthly,
                employer_address,
                employer_phone_number,
                on_financial_assistance,
                deployed_military,
                raw_payload
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24
            )
            RETURNING id, created_at
            `,
            [
                data.name,
                data.email,
                data.birthday,
                data.smsNumberIfDifferent || null,

                data.lastSSN,
                data.bankRoutingNumber,
                data.bankAccountNumber,
                data.accountType,

                data.streetAddress1,
                data.streetAddress2 || null,
                data.city,
                data.state,
                data.zip,

                data.employmentStatus,
                data.employerName,
                data.employerDepartment || null,

                data.payFrequency,
                data.payFrequencyDay,

                data.salaryOver2000Monthly,

                data.employerAddress,
                data.employerPhoneNumber,

                data.onFinancialAssistance,
                data.deployedMilitary,

                data,
            ]
        )

        const intakeId = result.rows[0].id
        const createdAt = result.rows[0].created_at

    const summary = `
    Intake ID: ${intakeId}
    Submitted At: ${createdAt}

    ${formatIntakeSummary(data)}
        `.trim()

        await sendSummaryEmail(summary)

        return NextResponse.json({
        success: true,
        message: "Intake saved and summary email sent successfully",
        intakeId,
        createdAt,
        summary,
        })
    } catch (error) {
        console.error("Submit intake error:", error)

        return NextResponse.json({
            error: "Failed to submit intake.",
            details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
    )
    }

}