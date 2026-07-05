import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize the free Upstash Redis client
const redis = Redis.fromEnv();

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.HEALER_WEBHOOK_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const payload = await req.json();

    if (!payload.incident_id || !payload.status) {
      return NextResponse.json({ error: "Malformed payload structure" }, { status: 400 });
    }

    // Push payload to the top of the Redis list
    await redis.lpush("rnm_incident_ledger", payload);

    // Keep only the 50 most recent incidents to save space
    await redis.ltrim("rnm_incident_ledger", 0, 49);

    return NextResponse.json({ success: true, message: "Incident logged successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}