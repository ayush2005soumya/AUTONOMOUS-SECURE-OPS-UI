"use client";

import Link from "next/link";
import { ShieldAlert, Activity, ArrowRight, Lock, Server } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-16 z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Lock className="text-blue-500" size={28} />
          <h2 className="text-blue-500 font-semibold tracking-widest uppercase text-sm">RNM Enterprise Security</h2>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
          Autonomous DevSecOps Pipeline
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Agentic AI frameworks designed to intercept, audit, and autonomously remediate infrastructure vulnerabilities before they reach production.
        </p>
      </div>

      {/* Project Portals / Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full z-10">
        
        {/* Phase 1: Gatekeeper IDE Card */}
        <Link href="/ide" className="group relative rounded-2xl bg-[#161b22] border border-[#30363d] p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col h-full">
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <ShieldAlert className="text-blue-400" size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-100">Phase 1: Gatekeeper IDE</h3>
          <p className="text-gray-400 mb-8 flex-1 leading-relaxed">
            A pre-commit interceptor utilizing local RAG and multi-agent reasoning to rewrite insecure Terraform configurations on the fly.
          </p>
          <div className="flex items-center text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
            Launch Workspace <ArrowRight size={18} className="ml-2" />
          </div>
        </Link>

        {/* Phase 2: Auto-Healer Card */}
        <Link href="/auto-healer" className="group relative rounded-2xl bg-[#161b22] border border-[#30363d] p-8 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col h-full">
          <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded-full">
            Next Objective
          </div>
          <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Activity className="text-emerald-400" size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-100">Phase 2: AWS Auto-Healer</h3>
          <p className="text-gray-400 mb-8 flex-1 leading-relaxed">
            A post-deployment continuous monitoring system that ingests CloudWatch alarms and autonomously patches live infrastructure.
          </p>
          <div className="flex items-center text-emerald-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
            Initialize Dashboard <ArrowRight size={18} className="ml-2" />
          </div>
        </Link>

      </div>

      {/* Footer / Tech Stack Indication */}
      <div className="mt-20 flex items-center gap-6 text-gray-500 text-sm font-medium z-10">
        <div className="flex items-center gap-2">
          <Server size={16} /> OpenRouter Architecture
        </div>
        <div className="w-1 h-1 bg-gray-600 rounded-full" />
        <div>Next.js React Framework</div>
        <div className="w-1 h-1 bg-gray-600 rounded-full" />
        <div>Terraform HCL</div>
      </div>
    </div>
  );
}