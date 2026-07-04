"use client";

import dynamic from "next/dynamic";

// This forces Next.js to render the component ONLY on the client,
// completely eliminating the hydration mismatch issue.
const IDEWorkspace = dynamic(() => import("./ideWorkspaceContent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen bg-[#1e1e1e] flex items-center justify-center text-white">
      Loading Gatekeeper IDE...
    </div>
  )
});

export default function Page() {
  return <IDEWorkspace />;
}