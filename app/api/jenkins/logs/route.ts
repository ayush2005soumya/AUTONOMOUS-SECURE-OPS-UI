import { NextResponse } from 'next/server';

// FIX 1: Force Next.js to NEVER cache this route so live polling actually works
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // FIX 2: Defensive environment check
        if (!process.env.JENKINS_URL || !process.env.JENKINS_USER || !process.env.JENKINS_API_TOKEN) {
            console.error("🚨 Missing Jenkins environment variables for log fetching.");
            return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
        }

        const jenkinsUrl = `${process.env.JENKINS_URL}/job/Phase-1-Auditor/lastBuild/consoleText`;

        const response = await fetch(jenkinsUrl, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64')
            },
            cache: 'no-store' // Prevents caching of the internal fetch
        });

        // Ensure your API route handles the case where no build is running gracefully
        if (!response.ok) {
            if (response.status === 404) return new NextResponse("Waiting for build...");
            // REMOVED: throw new Error(...) - don't throw, just return the current state
            return new NextResponse("Log stream unavailable.");
        }

        return new NextResponse(await response.text());

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}