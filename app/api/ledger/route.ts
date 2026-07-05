import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
const redis = Redis.fromEnv();

export async function GET() {
  try {
    // Fetch the list of incidents from Upstash
    const ledgerData = await redis.lrange("rnm_incident_ledger", 0, -1);
    return NextResponse.json(ledgerData || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}