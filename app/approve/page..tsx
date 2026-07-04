"use client";
import { useSearchParams } from "next/navigation";

export default function ApprovalPage() {
  const searchParams = useSearchParams();
  const buildId = searchParams.get("buildId");

  const handleApprove = async () => {
    await fetch("/api/jenkins/approve", {
      method: "POST",
      body: JSON.stringify({ buildId }),
      headers: { "Content-Type": "application/json" }
    });
    alert("Pipeline Approved! Returning to IDE...");
    window.location.href = "/ide";
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e1e] text-white">
      <h1 className="text-xl mb-4">Authorize Deployment for Build #{buildId}?</h1>
      <button 
        onClick={handleApprove}
        className="px-6 py-3 bg-emerald-600 rounded hover:bg-emerald-700 font-bold"
      >
        ✅ Authorize & Deploy
      </button>
    </div>
  );
}