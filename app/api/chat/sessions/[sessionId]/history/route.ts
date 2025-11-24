import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "https://ai-therapist-app-backend-1.onrender.com";

// Define an explicit type for the route's context parameter.
// This can help resolve complex type inference issues during the build.
type RouteContext = {
  params: {
    sessionId: string;
  };
};

/**
 * GET handler for fetching chat history for a specific session.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = context.params;
    console.log(`Getting chat history for session ${sessionId}`);

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to get chat history:", error);
      return NextResponse.json(
        { error: error.error || "Failed to get chat history" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Chat history retrieved successfully:", data);

    const formattedMessages = data.map((msg: any) => ({
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

