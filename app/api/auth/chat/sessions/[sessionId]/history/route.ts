// app/api/auth/chat/sessions/[sessionId]/history/route.ts
import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

export async function GET(req: Request) {
  try {
    // Get sessionId from URL
    const url = new URL(req.url);
    const sessionId = url.pathname.split("/").at(-2); // second last segment
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    console.log(`Getting chat history for session ${sessionId}`);

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to get chat history:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to get chat history" },
        { status: response.status }
      );
    }

    const data: ChatMessage[] = await response.json();

    const formattedMessages = data.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error getting chat history:", error);
    return NextResponse.json(
      { error: "Failed to get chat history" },
      { status: 500 }
    );
  }
}

