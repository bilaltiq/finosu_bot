import { NextResponse } from "next/server";
import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";

const AGENT_NAME = "loan-intake-agent";

export async function POST(request: Request) {
  try {
    const { roomName, participantName } = await request.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "roomName and participantName are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "Missing LiveKit environment variables" },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
      ttl: "30m",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    token.roomConfig = new RoomConfiguration({
      agents: [
        new RoomAgentDispatch({
          agentName: AGENT_NAME,
          metadata: JSON.stringify({
            source: "web-intake-demo",
          }),
        }),
      ],
    });

    // const dispatchClient = new AgentDispatchClient(
    //   livekitUrl,
    //   apiKey,
    //   apiSecret
    // );

    // try {
    //   await dispatchClient.createDispatch(roomName, AGENT_NAME, {
    //     metadata: JSON.stringify({
    //       source: "web-intake-demo",
    //       participantName,
    //     }),
    //   });
    // } catch (error) {
    //   console.warn("Agent dispatch may already exist or failed:", error);
    // }

    const jwt = await token.toJwt();

    return NextResponse.json({
      token: jwt,
      url: livekitUrl,
      roomName,
      participantName,
      agentName: AGENT_NAME,
    });
  } catch (error) {
    console.error("LiveKit token error:", error);

    return NextResponse.json(
      { error: "Failed to create LiveKit token" },
      { status: 500 }
    );
  }
}