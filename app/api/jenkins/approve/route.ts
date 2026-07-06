// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const { buildId } = await req.json();
//     const jenkinsUrl = `${process.env.JENKINS_URL}/job/Phase-1-Auditor/${buildId}/input/Proceed_Approval/proceedEmpty`;

//     const response = await fetch(jenkinsUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64'),
//       }
//     });

//     if (!response.ok) throw new Error("Failed to approve in Jenkins");
//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';

// SAFETY NET: If an email link hits this endpoint directly via a browser GET request,
// gracefully redirect them to the actual frontend Approval Page.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buildId = searchParams.get("buildId") || "";
  
  // Dynamically forward them to the UI route
  return NextResponse.redirect(new URL(`/approve?buildId=${buildId}`, req.url));
}

// export async function POST(req: Request) {
//   try {
//     const { buildId } = await req.json();
//     const jenkinsUrl = `${process.env.JENKINS_URL}/job/Phase-1-Auditor/${buildId}/input/Proceed_Approval/proceedEmpty`;

//     const response = await fetch(jenkinsUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64'),
//       }
//     });

//     if (!response.ok) throw new Error("Failed to approve in Jenkins");
//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }
export async function POST(req: Request) {
  try {
    const { buildId } = await req.json();
    const jenkinsUrl = `${process.env.JENKINS_URL}/job/Phase-1-Auditor/${buildId}/input/Proceed_Approval/proceedEmpty`;

    console.log(`[DEBUG] Attempting to hit Jenkins URL: ${jenkinsUrl}`);

    const response = await fetch(jenkinsUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64'),
      }
    });

    // THIS IS THE FIX: Reveal the exact status code and message
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jenkins rejected request - Status: ${response.status} | Details: ${errorText || response.statusText}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}