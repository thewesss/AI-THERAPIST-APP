import { NextRequest, NextResponse } from "next/server";

// Ensure the backend API URL is configured, with a fallback for local development.
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

/**
 * POST handler for sending a new message to a chat session.
 * @param req - The incoming Next.js request object.
 * @param context - An object containing the route parameters.
 * @param context.params - The dynamic route parameters, containing the sessionId.
 */
export async function POST(
  req: NextRequest,
  context: { params: { sessionId: string } }
) {
  // Directly get sessionId from the context params, which is the standard Next.js way.
  // This is more reliable than parsing the URL manually.
  const { sessionId } = context.params;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Forward the request to the backend service to post the new message.
    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    // If the backend responds with an error, forward that error.
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to send message" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}



