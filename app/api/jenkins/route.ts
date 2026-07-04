// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { username, email, targetRepo, commitBranch, mergeBranch, tfContent } = body;
    
//     // Auth string for headers
//     const auth = 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64');
//     const baseUrl = process.env.JENKINS_URL;

//     // 1. Fetch the Crumb
//     const crumbRes = await fetch(`${baseUrl}/crumbIssuer/api/json`, {
//         headers: { 'Authorization': auth }
//     });
    
//     if (!crumbRes.ok) throw new Error("Failed to fetch Jenkins Crumb. Check your credentials.");
//     const crumbData = await crumbRes.json();
//     const crumbHeader = crumbData.crumbRequestField;
//     const crumbValue = crumbData.crumb;

//     // 2. Prepare the POST request with the Crumb
//     const jenkinsUrl = `${baseUrl}/job/Phase-1-Auditor/buildWithParameters`;
//     const params = new URLSearchParams({
//       GITHUB_USERNAME: username,
//       ALERT_EMAIL: email,
//       TARGET_REPO: targetRepo,
//       COMMIT_BRANCH: commitBranch,
//       MERGE_BRANCH: mergeBranch,
//       TF_FILE_CONTENT: tfContent
//     });

//     const response = await fetch(jenkinsUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': auth,
//         'Content-Type': 'application/x-www-form-urlencoded',
//         [crumbHeader]: crumbValue // Inject the Crumb here!
//       },
//       body: params.toString()
//     });

//     if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Jenkins rejected request (${response.status}): ${errorText}`);
//     }

//     return NextResponse.json({ success: true, message: "Pipeline started" });

//   } catch (error: any) {
//     console.error("❌ Jenkins API Error:", error.message);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, targetRepo, commitBranch, mergeBranch, tfContent } = body;

    const jenkinsUrl = `${process.env.JENKINS_URL}/job/Phase-1-Auditor/buildWithParameters`;
    const params = new URLSearchParams({
      GITHUB_USERNAME: username,
      ALERT_EMAIL: email,
      TARGET_REPO: targetRepo,
      COMMIT_BRANCH: commitBranch,
      MERGE_BRANCH: mergeBranch,
      TF_FILE_CONTENT: tfContent
    });

    console.log("🚀 Attempting to trigger Jenkins at:", jenkinsUrl);

    const response = await fetch(jenkinsUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
        // Log the exact error from Jenkins to your terminal
        const errorText = await response.text();
        console.error("❌ Jenkins API Error Details:", errorText);
        throw new Error(`Jenkins status ${response.status}: ${errorText}`);
    }

    return NextResponse.json({ success: true, message: "Pipeline started" });

  } catch (error: any) {
    console.error("❌ API Route Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}