import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1. Safe Body Parsing
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Verify URL (Debug Log)
  const API_URL = process.env.BACKEND_API_URL || "https://ai-therapist-app-backend-1.onrender.com";
  console.log(`[Proxy] Attempting to register at: ${API_URL}/auth/register`);

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 3. Handle Non-JSON Responses (The likely cause of your 500)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`[Proxy Error] Backend returned non-JSON: ${text}`);
      return NextResponse.json(
        { message: "Backend returned an error", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error: any) {
    // 4. Log the REAL error to Netlify Function Logs
    console.error("[Proxy Exception]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}