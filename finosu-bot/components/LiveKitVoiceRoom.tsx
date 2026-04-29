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
      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: "finosu-demo-room",
          participantName: `applicant-${Date.now()}`,
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
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Voice Intake</h2>
        <p className="mt-2 text-sm text-slate-300">
          Start a LiveKit voice room. This confirms the browser can connect to
          the real-time voice session.
        </p>

        <button
          onClick={startVoiceRoom}
          disabled={status === "connecting"}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "connecting" ? "Connecting..." : "Start Voice Intake"}
        </button>

        {status === "error" && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <h2 className="text-xl font-semibold">Voice Intake Connected</h2>
      <p className="mt-2 text-sm text-slate-300">
        Connected to room:{" "}
        <span className="font-mono">{connectionDetails.roomName}</span>
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
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
          <ControlBar controls={{ camera: false, screenShare: false }} />
        </LiveKitRoom>
      </div>
    </section>
  );
}
