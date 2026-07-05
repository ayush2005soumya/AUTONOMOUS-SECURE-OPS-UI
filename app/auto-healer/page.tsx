"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Heart,
  Network,
  Server,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";

// Matches the exact JSON schema produced by your AWS Lambda
interface IncidentPayload {
  incident_id: string;
  timestamp_utc: string;
  log_group: string;
  resource_id: string;
  duration_ms: number;
  status: "AUTO_MENDED" | "ALERT_ONLY" | "RCA_FAILED";
  ai: {
    model: string;
    diagnosis: string;
    severity: string;
    confidence: number;
    evidence: string;
    rationale: string;
  };
  remediation: {
    action: string;
    executed: boolean;
    details: any;
  };
}

interface VitalSign {
  name: string;
  icon: React.ReactNode;
  value: string;
  status: "ok" | "critical";
}

export default function AutoHealerPage() {
  const [incidents, setIncidents] = useState<IncidentPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vitals, setVitals] = useState<VitalSign[]>([
    { name: "EC2 Target Fleet", icon: <Server size={18} />, value: "Active", status: "ok" },
    { name: "RDS Database Cluster", icon: <Database size={18} />, value: "Online", status: "ok" },
    { name: "Edge Network Throughput", icon: <Network size={18} />, value: "Nominal", status: "ok" },
  ]);

  // Fetch the data directly from your Upstash Redis endpoint
  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/ledger");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        
        // Dynamically adjust system operational health vitals based on real cloud state
        if (data.length > 0 && data[0].status === "AUTO_MENDED") {
          const hoursSinceLastIncident = (Date.now() - new Date(data[0].timestamp_utc).getTime()) / 3600000;
          if (hoursSinceLastIncident < 0.05) { 
            // If an incident occurred in the last 3 minutes, show the fleet was impacted
            setVitals([
              { name: "EC2 Target Fleet", icon: <Server size={18} />, value: "Recovered", status: "ok" },
              { name: "RDS Database Cluster", icon: <Database size={18} />, value: "Online", status: "ok" },
              { name: "Edge Network Throughput", icon: <Network size={18} />, value: "Nominal", status: "ok" },
            ]);
            return;
          }
        }
        // Default healthy state
        setVitals([
          { name: "EC2 Target Fleet", icon: <Server size={18} />, value: "Healthy", status: "ok" },
          { name: "RDS Database Cluster", icon: <Database size={18} />, value: "Healthy", status: "ok" },
          { name: "Edge Network Throughput", icon: <Network size={18} />, value: "Nominal", status: "ok" },
        ]);
      }
    } catch (err) {
      console.error("Error communicating with ledger API:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLedger();
    // Poll the live database every 4 seconds
    const interval = setInterval(fetchLedger, 4000); 
    return () => clearInterval(interval);
  }, []);

  const latestIncident = incidents[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-zinc-200 font-mono p-6 space-y-6">
      {/* Header */}
      <header className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-400" size={28} />
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">RNM Auto-Healer · SRE Command Center</h1>
            <p className="text-xs text-zinc-500">Phase 2 · Live Telemetry Stream Ingestion Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${
            latestIncident && (Date.now() - new Date(latestIncident.timestamp_utc).getTime() < 120000)
              ? "bg-amber-900/40 text-amber-300 border-amber-700/50 animate-pulse"
              : "bg-emerald-900/40 text-emerald-300 border-emerald-700/50"
          }`}>
            {latestIncident && (Date.now() - new Date(latestIncident.timestamp_utc).getTime() < 120000)
              ? "● MITIGATING INCIDENT"
              : "● INFRASTRUCTURE SYSTEM OK"}
          </span>
        </div>
      </header>

      {/* Vitals */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vitals.map((v, i) => (
          <div key={i} className="bg-[#161b22] border border-zinc-800 rounded-lg p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              {v.icon}
              <span>{v.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-zinc-100">{v.value}</span>
              <span className={`inline-block w-2 h-2 rounded-full ml-2 ${v.status === "ok" ? "bg-emerald-400" : "bg-red-500"}`} />
            </div>
          </div>
        ))}
      </section>

      {/* Telemetry and Logs Split Frame */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Raw Exception Evidence Captured */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[380px]">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-sm text-zinc-300 bg-[#0d1117]">
            <Terminal size={14} className="text-red-400" />
            <span>Target Error Signature Capture · /aws/cloudwatch</span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 text-xs text-red-300/90 leading-relaxed bg-[#0a0d12]">
            {latestIncident ? (
              <pre className="whitespace-pre-wrap font-mono">{latestIncident.ai?.evidence}</pre>
            ) : (
              <div className="text-zinc-600 italic">No historical metrics exceptions captured in the current cycle.</div>
            )}
          </div>
        </div>

        {/* Right Panel: LLM Mindstream Thinking Process */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[380px]">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-sm text-zinc-300 bg-[#0d1117]">
            <Brain size={14} className="text-fuchsia-400" />
            <span>AI Real-Time Rationalization Engine</span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 text-xs space-y-2 text-zinc-300">
            {latestIncident ? (
              <>
                <div className="text-fuchsia-400 font-semibold">▸ Model: {latestIncident.ai?.model || "gemini-1.5-flash"}</div>
                <div className="text-zinc-400">▸ Severity Class: <span className="text-red-400 font-bold uppercase">{latestIncident.ai?.severity}</span></div>
                <div className="text-zinc-400">▸ Engine Target: <span className="text-sky-400">{latestIncident.resource_id}</span></div>
                <div className="text-zinc-400">▸ Execution Confidence: <span className="text-emerald-400">{((latestIncident.ai?.confidence || 0) * 100).toFixed(0)}%</span></div>
                <div className="border-t border-zinc-800 my-2 pt-2 text-zinc-300 bg-zinc-900/30 p-2 rounded">
                  <span className="text-fuchsia-300 font-semibold block mb-1">Root Cause Rationale:</span>
                  {latestIncident.ai?.rationale}
                </div>
              </>
            ) : (
              <div className="text-zinc-600 italic">Awaiting incident telemetry ingestion tokens from EventBridge...</div>
            )}
          </div>
        </div>
      </section>

      {/* Audit Log Ledger Table */}
      <section className="bg-[#161b22] border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 text-sm font-semibold text-zinc-200 bg-[#0d1117]">
          <Wrench size={14} className="text-amber-400" />
          <span>Immutable System Auto-Remediation Ledger</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Target Instance</th>
                <th className="px-4 py-3">RCA Diagnosis</th>
                <th className="px-4 py-3">Action Invoked</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 italic">Reading ledger memory...</td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 italic">System healthy. No auto-remediation records saved.</td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.incident_id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {incident.timestamp_utc.replace("T", " ").substring(0, 19)}
                    </td>
                    <td className="px-4 py-3 text-sky-400 font-semibold">{incident.resource_id}</td>
                    <td className="px-4 py-3 text-zinc-300 max-w-xs truncate" title={incident.ai?.diagnosis}>
                      {incident.ai?.diagnosis}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">{incident.remediation?.action}</code>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{(incident.duration_ms / 1000).toFixed(2)}s</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        incident.status === "AUTO_MENDED" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        <CheckCircle2 size={12} />
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}