import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk"

export async function POST(request: Request) {
    try {
        const { roomName, participantName } = await request.json()

        if (!roomName || !participantName) {
            return NextResponse.json(
                { error: "roomName and participantName required"},
                { status: 400}
            )
        }

        const apiKey = process.env.LIVEKIT_API_KEY
        const apiSecret = process.env.LIVEKIT_API_SECRET
        const livekitURL = process.env.LIVEKIT_URL

        if (!apiKey || !apiSecret || !livekitURL){
            return NextResponse.json(
                { error: "Env variables missing for Livekit"},
                {status: 500}
            )
        }

        const token = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
            name: participantName,
            ttl: "30m"
        })

        token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true
        })

        const jwt = await token.toJwt()

        return NextResponse.json({
            token: jwt,
            url: livekitURL,
            roomName,
            participantName
        })
    } catch (error) {
        console.error("LiveKit token error:", error)

        return NextResponse.json(
            {error: "Failed to make a livekit room"},
            {status: 500}
        )
    }
}