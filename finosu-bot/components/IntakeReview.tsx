"use client";

import { useState } from "react";
import Image from "next/image";
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
        setMessage("Submission failed. Check console.");
        return;
      }

      setStatus("success");
      setMessage(result.message || "Summary email sent successfully.");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Something went wrong. Please review and try again.");
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
    <main className="min-h-screen bg-[#fafafa] text-[#090b17]">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <header className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-black/5 bg-white/80 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Image
              src="/finosu-logo.svg"
              alt="Finosu logo"
              width={116}
              height={36}
              priority
              className="h-9 w-auto object-contain"
            />
          </div>

          <nav className="hidden items-center gap-8 font-mono text-sm text-[#111322] sm:flex">
            <span> Voice Assistant for Loan Information </span>
          </nav>

          <a className="rounded-full bg-[#080d22] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(8,13,34,0.22)]">
            Demo
          </a>
        </header>

        <section className="mx-auto mt-16 max-w-4xl text-center">
          <div className="mx-auto mb-7 w-fit rounded-full border border-[#dfe5ff] bg-white px-5 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[#8ea0ff]">
            Live Voice
          </div>

          <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[tighter] text-[#101119] sm:text-4xl">
            Personal + Loan Info Collected by an Agent
          </h1>

          <p className="mx-auto mt-8 max-w-3xl font-mono text-lg leading-8 text-[#383b48]">
            A LiveKit agent gathers borrower information and validates it. Upon
            validation, it sends a summary to your email.
          </p>
        </section>

        <section className="mt-14 rounded-[2rem] border border-[#e1e3ea] bg-[#f1f2f6] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.5rem] bg-transparent p-4 sm:p-6">
              <h2 className="mt-8 max-w-sm text-4xl font-bold leading-tight tracking-[-0.04em]">
                Voice call to your Email
              </h2>

              <p className="mt-8 max-w-md font-mono text-lg leading-8 text-[#4d505b]">
                The agent will ask you one question at a time. It will store
                those answers, confirm the important fields and then submit the
                final json payload through Resend.
              </p>

              <div className="mt-24 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#a8acb7]" />
                <span className="h-2 w-2 rounded-full bg-[#a8acb7]" />
                <span className="h-2 w-2 rounded-full bg-[#a8acb7]" />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#dfe1e7] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-3xl font-black tracking-[-0.04em] text-[#9b9ca4]">
                    Voice Session
                  </h3>
                  <p className="mt-2 font-mono text-sm text-[#9ba8ff]">
                    LiveKit Cloud Agent
                  </p>
                </div>
              </div>

              <LiveKitVoiceRoom />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#e1e3ea] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#eceef4] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#9ba8ff]">
                Output (For Testing Purposes)
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                Debugging Form
              </h2>
            </div>
          </div>

          <FormSection number="01" title="Applicant Information">
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
          </FormSection>

          <FormSection number="02" title="Bank Information">
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
            <SelectInput
              label="Checking / Savings"
              value={formData.accountType}
              options={[
                { label: "Checking", value: "checking" },
                { label: "Savings", value: "savings" },
              ]}
              onChange={(value) => updateField("accountType", value)}
            />
          </FormSection>

          <FormSection number="03" title="Address">
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
          </FormSection>

          <FormSection number="04" title="Employment">
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
            <SelectInput
              label="Pay Frequency"
              value={formData.payFrequency}
              options={[
                { label: "Weekly", value: "weekly" },
                { label: "Biweekly", value: "biweekly" },
                { label: "Semimonthly", value: "semimonthly" },
                { label: "Monthly", value: "monthly" },
              ]}
              onChange={(value) => updateField("payFrequency", value)}
            />
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
          </FormSection>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
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

          <div className="mt-8 flex flex-col gap-4 rounded-[1.5rem] border border-[#e5e8f5] bg-[#f8f9ff] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9ba8ff]">
                Final Step
              </p>
              <p className="mt-1 text-sm text-[#555967]">
                Send the completed structured intake as a formatted email.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {message && (
                <p
                  className={
                    status === "success"
                      ? "font-mono text-sm text-green-600"
                      : "font-mono text-sm text-red-500"
                  }
                >
                  {message}
                </p>
              )}

              <button
                onClick={submitIntake}
                disabled={status === "sending"}
                className="rounded-full bg-[#080d22] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_35px_rgba(8,13,34,0.22)] transition hover:-translate-y-0.5 hover:bg-[#111936] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Send Summary Email"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-[1.5rem] border border-[#e7e9f0] bg-[#fbfbfd] p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="font-mono text-sm text-[#a2a5af]">{number}</span>
        <h3 className="text-xl font-black tracking-[-0.03em]">{title}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
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
      <span className="font-mono text-xs uppercase tracking-wide text-[#a0a3ad]">
        {label}
      </span>
      <input
        className="cursor-text rounded-2xl border border-[#e0e3ed] bg-white px-4 py-3 font-mono text-sm text-[#8f93a0] outline-none transition placeholder:text-[#b7bac5] hover:border-[#cfd5f2] focus:border-[#aebcff] focus:text-[#111322] focus:ring-4 focus:ring-[#edf0ff]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-wide text-[#a0a3ad]">
        {label}
      </span>
      <select
        className="cursor-pointer rounded-2xl border border-[#e0e3ed] bg-white px-4 py-3 font-mono text-sm text-[#8f93a0] outline-none transition hover:border-[#cfd5f2] focus:border-[#aebcff] focus:text-[#111322] focus:ring-4 focus:ring-[#edf0ff]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
    <label className="flex items-center gap-3 rounded-2xl border border-[#e0e3ed] bg-white px-4 py-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#080d22]"
      />
      <span className="font-mono text-sm text-[#343744]">{label}</span>
    </label>
  );
}
