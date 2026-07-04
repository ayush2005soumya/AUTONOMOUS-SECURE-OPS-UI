import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { buildId } = await req.json();
    const jenkinsUrl = `${process.env.JENKINS_URL}/job/Phase-1-Auditor/${buildId}/input/Proceed_Approval/proceedEmpty`;

    const response = await fetch(jenkinsUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64'),
      }
    });

    if (!response.ok) throw new Error("Failed to approve in Jenkins");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}