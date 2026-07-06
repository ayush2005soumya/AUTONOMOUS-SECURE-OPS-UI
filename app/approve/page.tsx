"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 1. Move the core layout logic into its own internal sub-component
function ApprovalContent() {
  const searchParams = useSearchParams();
  const buildId = searchParams.get("buildId");

  const handleApprove = async () => {
    try {
      const response = await fetch("/api/jenkins/approve", {
        method: "POST",
        body: JSON.stringify({ buildId }),
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Approval rejected");

      alert("Pipeline Approved! Returning to IDE...");
      window.location.href = "/ide";
    } catch (err: any) {
      alert(`Error authorizing deployment: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e1e] text-white font-mono">
      <div className="p-8 bg-[#2d2d2d] rounded-lg border border-zinc-700 shadow-xl text-center max-w-md">
        <h1 className="text-xl font-bold mb-2 text-zinc-100">Deployment Gatekeeper</h1>
        <p className="text-sm text-zinc-400 mb-6">Authorize Pipeline Execution for Build #{buildId}?</p>
        
        <button 
          onClick={handleApprove}
          className="w-full px-6 py-3 bg-emerald-600 rounded hover:bg-emerald-700 transition-colors font-bold text-sm tracking-wide"
        >
          ✅ Authorize & Deploy
        </button>
      </div>
    </div>
  );
}

// 2. Wrap the component inside a Suspense boundary as required by Next.js
export default function ApprovalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-zinc-400 font-mono text-sm">
        Loading authorization parameters...
      </div>
    }>
      <ApprovalContent />
    </Suspense>
  );
}