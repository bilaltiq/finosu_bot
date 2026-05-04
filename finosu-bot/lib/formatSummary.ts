import type { IntakeForm } from "./intakeSchema";

export function formatIntakeSummary(data: IntakeForm) {
    return `
    Loan Intake Summary

    Name: ${data.name}
    Email: ${data.email}
    Birthday: ${data.birthday}
    SMS Number if Different: ${data.smsNumberIfDifferent || "N/A"}
    Last Four SSN: ${data.lastSSN}

    Bank Account Routing Number: ${data.bankRoutingNumber}
    Bank Account Number: ${data.bankAccountNumber}
    Checking / Savings: ${data.accountType}

    Street Address 1: ${data.streetAddress1}
    Street Address 2: ${data.streetAddress2 || "N/A"}
    City: ${data.city}
    State: ${data.state}
    Zip Code: ${data.zip}

    Employment Status: ${data.employmentStatus}
    Employer Name: ${data.employerName}
    Employer Department: ${data.employerDepartment || "N/A"}

    Pay Frequency: ${data.payFrequency}
    Pay Frequency Day: ${data.payFrequencyDay}

    Salary Over $2,000/Month: ${data.salaryOver2000Monthly ? "Yes" : "No"}
    Employer Address: ${data.employerAddress}
    Employer Phone Number: ${data.employerPhoneNumber}

    Financial Assistance: ${data.onFinancialAssistance ? "Yes" : "No"}
    Deployed Military: ${data.deployedMilitary ? "Yes" : "No"}

    `.trim();
}