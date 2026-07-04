import { NextResponse } from 'next/server';

// Ensure this route is dynamic so it always fetches the latest file state from GitHub
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Check if the GitHub Personal Access Token is configured
    if (!process.env.GITHUB_PAT) {
        console.error("🚨 Missing GITHUB_PAT environment variable.");
        return NextResponse.json({ error: "GitHub configuration missing" }, { status: 500 });
    }

    const { username, targetRepo, commitBranch, fileName } = await req.json();
    
    if (!username || !targetRepo || !commitBranch || !fileName) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // GitHub API endpoint for raw file contents on a specific branch
    const url = `https://api.github.com/repos/${username}/${targetRepo}/contents/${fileName}?ref=${commitBranch}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3.raw' // Forces GitHub to return the raw file content
      },
      cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch file from GitHub: ${response.statusText}`);
    }
    
    const rawCode = await response.text();
    return NextResponse.json({ code: rawCode });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}