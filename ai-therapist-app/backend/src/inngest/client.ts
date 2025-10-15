import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "ai-therapist-agent",
  eventKey: process.env.INNGEST_API_KEY, 
});

export const functions = [];
