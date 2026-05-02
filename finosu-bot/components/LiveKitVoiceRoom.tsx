"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";

type TokenResponse = {
  token: string;
  url: string;
  roomName: string;
  participantName: string;
};

export default function LiveKitVoiceRoom() {
  const [connectionDetails, setConnectionDetails] =
    useState<TokenResponse | null>(null);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");

  const [error, setError] = useState("");

  async function startVoiceRoom() {
    setStatus("connecting");
    setError("");

    try {
      const sessionID = Date.now();

      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: `finosu-demo-room-${sessionID}`,
          participantName: `applicant-${sessionID}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get LiveKit token");
      }

      setConnectionDetails(result);
      setStatus("connected");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setError(
        error instanceof Error ? error.message : "Failed to connect to room",
      );
    }
  }

  if (!connectionDetails) {
    return (
      <section className="rounded-[1.25rem] border border-[#e5e8f5] bg-[#fbfbfd] p-5">
        <div className="rounded-2xl border border-[#e0e4f7] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#a0a6b4]">
                Call Status
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#101119]">
                Voice Intake
              </h2>
            </div>

            <span className="rounded-full bg-[#f1f3ff] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-[#7c8eff]">
              Ready
            </span>
          </div>

          <p className="mt-4 max-w-xl font-mono text-sm leading-6 text-[#555967]">
            Start a LiveKit voice room.
          </p>

          <div className="mt-6 rounded-2xl border border-[#edf0fb] bg-[#f8f9ff] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a0a6b4]">
                Session
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#a8acb7]" />
                <span className="font-mono text-xs text-[#8f93a0]">
                  Not connected
                </span>
              </div>
            </div>

            <button
              onClick={startVoiceRoom}
              disabled={status === "connecting"}
              className="w-full rounded-full bg-[#080d22] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_35px_rgba(8,13,34,0.22)] transition hover:-translate-y-0.5 hover:bg-[#111936] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "connecting" ? "Connecting..." : "Start Voice Intake"}
            </button>
          </div>

          {status === "error" && (
            <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 font-mono text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.25rem] border border-[#e5e8f5] bg-[#fbfbfd] p-5">
      <div className="rounded-2xl border border-[#e0e4f7] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#a0a6b4]">
              Call Status
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#101119]">
              Voice Intake Connected
            </h2>
          </div>

          <span className="rounded-full bg-[#eef1ff] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-[#647cff]">
            Live
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#edf0fb] bg-[#f8f9ff] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a0a6b4]">
              Room
            </p>
            <p className="mt-2 truncate font-mono text-sm text-[#111322]">
              {connectionDetails.roomName}
            </p>
          </div>

          <div className="rounded-2xl border border-[#edf0fb] bg-[#f8f9ff] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a0a6b4]">
              Participant
            </p>
            <p className="mt-2 truncate font-mono text-sm text-[#111322]">
              {connectionDetails.participantName}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e5e8f5] bg-[#f8f9ff] p-3">
          <LiveKitRoom
            token={connectionDetails.token}
            serverUrl={connectionDetails.url}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => {
              setConnectionDetails(null);
              setStatus("idle");
            }}
          >
            <RoomAudioRenderer />
            <div className="rounded-2xl border border-[#edf0fb] bg-white p-2">
              <ControlBar controls={{ camera: false, screenShare: false }} />
            </div>
          </LiveKitRoom>
        </div>
      </div>
    </section>
  );
}
