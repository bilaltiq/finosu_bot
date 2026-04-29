"use client";

import { useState } from "react";
import LiveKitVoiceRoom from "./LiveKitVoiceRoom";

const sampleIntake = {
  name: "Gabriel Vincent",
  email: "bilal@amherst.edu",
  birthday: "1998-05-12",
  smsNumberIfDifferent: "1-413-...",
  lastSSN: "1234",
  bankRoutingNumber: "021000021",
  bankAccountNumber: "123456789",
  accountType: "checking",
  streetAddress1: "123 Main Street",
  streetAddress2: "Apt 4B",
  city: "Amherst",
  state: "MA",
  zip: "01002",
  employmentStatus: "Employed",
  employerName: "Amherst College",
  employerDepartment: "Operations",
  payFrequency: "biweekly",
  payFrequencyDay: "Friday",
  specificDay: "Every other Friday",
  salaryOver2000Monthly: true,
  employerAddress: "220 South Pleasant Street",
  employerPhoneNumber: "4135551234",
  onFinancialAssistance: false,
  deployedMilitary: false,
};

export default function IntakeReview() {
  const [formData, setFormData] = useState(sampleIntake);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function submitIntake() {
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/submit-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        setStatus("error");
        setMessage("Submission Failed. Check console");
        return;
      }

      setStatus("success");
      setMessage(result.message || "Summary email send successfully");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Something went wrong. Please review and try again");
    }
  }

  function updateField(
    field: keyof typeof sampleIntake,
    value: string | boolean,
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Finosu Intake Bot
          </p>
          <h1 className="mt-2 text-3xl font-bold">Loan Intake Review</h1>
          <p className="mt-3 text-slate-300">
            This page represents the structured form the voice bot will fill.
            For now, it uses editable sample data so we can test the email flow.
          </p>
        </div>

        <div className="mb-6">
          <LiveKitVoiceRoom />
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Applicant Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Name"
              value={formData.name}
              onChange={(value) => updateField("name", value)}
            />
            <TextInput
              label="Email"
              value={formData.email}
              onChange={(value) => updateField("email", value)}
            />
            <TextInput
              label="Birthday"
              value={formData.birthday}
              onChange={(value) => updateField("birthday", value)}
            />
            <TextInput
              label="SMS Number if Different"
              value={formData.smsNumberIfDifferent}
              onChange={(value) => updateField("smsNumberIfDifferent", value)}
            />
            <TextInput
              label="Last Four SSN"
              value={formData.lastSSN}
              onChange={(value) => updateField("lastSSN", value)}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Bank Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Routing Number"
              value={formData.bankRoutingNumber}
              onChange={(value) => updateField("bankRoutingNumber", value)}
            />
            <TextInput
              label="Account Number"
              value={formData.bankAccountNumber}
              onChange={(value) => updateField("bankAccountNumber", value)}
            />

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-300">
                Checking / Savings
              </span>
              <select
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                value={formData.accountType}
                onChange={(event) =>
                  updateField("accountType", event.target.value)
                }
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Address</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Street Address 1"
              value={formData.streetAddress1}
              onChange={(value) => updateField("streetAddress1", value)}
            />
            <TextInput
              label="Street Address 2"
              value={formData.streetAddress2}
              onChange={(value) => updateField("streetAddress2", value)}
            />
            <TextInput
              label="City"
              value={formData.city}
              onChange={(value) => updateField("city", value)}
            />
            <TextInput
              label="State"
              value={formData.state}
              onChange={(value) => updateField("state", value)}
            />
            <TextInput
              label="Zip Code"
              value={formData.zip}
              onChange={(value) => updateField("zip", value)}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Employment</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Employment Status"
              value={formData.employmentStatus}
              onChange={(value) => updateField("employmentStatus", value)}
            />
            <TextInput
              label="Employer Name"
              value={formData.employerName}
              onChange={(value) => updateField("employerName", value)}
            />
            <TextInput
              label="Employer Department"
              value={formData.employerDepartment}
              onChange={(value) => updateField("employerDepartment", value)}
            />

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-300">
                Pay Frequency
              </span>
              <select
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                value={formData.payFrequency}
                onChange={(event) =>
                  updateField("payFrequency", event.target.value)
                }
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="semimonthly">Semimonthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <TextInput
              label="Pay Frequency Day"
              value={formData.payFrequencyDay}
              onChange={(value) => updateField("payFrequencyDay", value)}
            />
            <TextInput
              label="Specific Day"
              value={formData.specificDay}
              onChange={(value) => updateField("specificDay", value)}
            />
            <TextInput
              label="Employer Address"
              value={formData.employerAddress}
              onChange={(value) => updateField("employerAddress", value)}
            />
            <TextInput
              label="Employer Phone Number"
              value={formData.employerPhoneNumber}
              onChange={(value) => updateField("employerPhoneNumber", value)}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <CheckboxInput
              label="Salary over $2,000/month"
              checked={formData.salaryOver2000Monthly}
              onChange={(value) => updateField("salaryOver2000Monthly", value)}
            />
            <CheckboxInput
              label="On financial assistance"
              checked={formData.onFinancialAssistance}
              onChange={(value) => updateField("onFinancialAssistance", value)}
            />
            <CheckboxInput
              label="Deployed military"
              checked={formData.deployedMilitary}
              onChange={(value) => updateField("deployedMilitary", value)}
            />
          </div>
        </section>

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={submitIntake}
            disabled={status === "sending"}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : "Send Summary Email"}
          </button>

          {message && (
            <p
              className={
                status === "success" ? "text-green-400" : "text-red-400"
              }
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}
