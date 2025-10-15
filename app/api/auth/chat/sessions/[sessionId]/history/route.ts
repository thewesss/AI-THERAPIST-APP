import { NextResponse } from "next/server";

// Define the expected structure of a chat message from the backend.
interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

// Ensure the backend API URL is configured, with a fallback for local development.
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

/**
 * GET handler for fetching chat history for a specific session.
 * @param req - The incoming Next.js request object.
 * @param context - An object containing route parameters. We destructure `params` from it.
 * @param context.params - The dynamic route parameters. For this route, it's { sessionId: string }.
 */
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } } // This is the corrected and specific type for the route context.
) {
  const { sessionId } = params; // Extract the session ID from the params object.

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching chat history for session: ${sessionId}`);

    // Forward the request to the backend service.
    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    // If the backend responds with an error, forward it.
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend failed to get chat history:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to get chat history" },
        { status: response.status }
      );
    }

    // Parse the successful response from the backend.
    const data: ChatMessage[] = await response.json();

    // The frontend might expect a different format, so we can map it here if needed.
    // In this case, the format is the same, so this is an identity mapping.
    const formattedMessages = data.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    // Return a generic 500 Internal Server Error for unexpected issues.
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
