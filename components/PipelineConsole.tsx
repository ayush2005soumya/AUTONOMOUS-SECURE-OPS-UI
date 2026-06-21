"use client";

import { useState, useEffect, useRef } from "react";
import { Paintbrush, Server, ShieldAlert, CheckCircle, Mail, AlertTriangle, ArrowRight } from "lucide-react";
import { LogEntry } from "@/app/ide/page";

interface PipelineConsoleProps {
  logs: LogEntry[];
  isAuditing: boolean;
  onTriggerPipeline: () => void;
}

type PipelineStep = "idle" | "git_push" | "jenkins_active" | "power_automate_alert" | "awaiting_approval" | "complete";

export default function PipelineConsole({ logs, isAuditing, onTriggerPipeline }: PipelineConsoleProps) {
  const [pipelineState, setPipelineState] = useState<PipelineStep>("idle");
  const streamBottomRef = useRef<HTMLDivElement>(null);

  // Sync internal pipeline step tracking with parent auditing state
  useEffect(() => {
    if (isAuditing) {
      sequencePipelineVisuals();
    }
  }, [isAuditing]);

  // Auto-scroll the live audit stream
  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const sequencePipelineVisuals = async () => {
    setPipelineState("git_push");
    await new Promise((r) => setTimeout(r, 1400));
    setPipelineState("jenkins_active");
    await new Promise((r) => setTimeout(r, 2700));
    setPipelineState("power_automate_alert");
    await new Promise((r) => setTimeout(r, 1000));
    setPipelineState("awaiting_approval");
  };

  const handleApproval = (authorized: boolean) => {
    if (authorized) {
      setPipelineState("complete");
    } else {
      setPipelineState("idle");
    }
  };

  return (
    <div className="h-64 bg-[#181818] border-t border-[#2b2b2b] flex font-mono text-xs select-none relative z-10">
      
      {/* LEFT PANEL: Interactive Actions & Status Matrix */}
      <div className="w-1/3 border-r border-[#2b2b2b] bg-[#1e1e1e] p-4 flex flex-col justify-between">
        <div>
          <div className="text-[#858585] uppercase text-[10px] font-bold tracking-wider mb-3 flex items-center gap-1.5">
            <Server size={12} /> Pipeline Control Center
          </div>
          
          {/* Action Button */}
          {pipelineState === "idle" && (
            <button
              onClick={onTriggerPipeline}
              className="w-full py-2.5 px-4 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-semibold flex items-center justify-center gap-2 transition"
            >
              <Paintbrush size={14} /> Initiate Git Push
            </button>
          )}

          {/* Active Status Display */}
          {pipelineState !== "idle" && (
            <div className="space-y-2">
              <div className="p-2 rounded bg-[#252526] border border-[#3c3c3c] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pipelineState === "awaiting_approval" ? "bg-amber-500 animate-pulse" : "bg-blue-500 animate-spin"}`} />
                <span className="text-white capitalize font-semibold">{pipelineState.replace("_", " ")}</span>
              </div>
            </div>
          )}
        </div>

        {/* HUMAN-IN-THE-LOOP APPROVAL MODULE */}
        {pipelineState === "awaiting_approval" && (
          <div className="p-3 bg-[#2d2013] border border-[#5c3e1e] rounded animate-fadeIn">
            <div className="text-amber-400 font-bold flex items-center gap-1.5 mb-2">
              <Mail size={14} /> Power Automate Routing Action
            </div>
            <p className="text-[#cccccc] text-[11px] mb-3 leading-relaxed">
              Alerts dispatched to Teams/Outlook. Awaiting baseline confirmation:
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleApproval(true)}
                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition"
              >
                Authorize & PR
              </button>
              <button 
                onClick={() => handleApproval(false)}
                className="px-2 py-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 rounded transition"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {pipelineState === "complete" && (
          <div className="p-3 bg-[#142918] border border-[#1e4624] rounded text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle size={16} /> Changes Merged & PR Opened Successfully
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live Log / DevSecOps Output Stream */}
      <div className="flex-1 flex flex-col bg-[#151515]">
        <div className="h-8 px-4 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center text-[#858585] uppercase text-[10px] font-bold tracking-wider">
          DevSecOps Execution Stream
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {logs.map((line, index) => {
            let colorClass = "text-[#cccccc]";
            if (line.type === "success") colorClass = "text-[#4caf50]";
            if (line.type === "warning") colorClass = "text-[#dcb67a]";
            if (line.type === "error") colorClass = "text-[#f44336]";
            if (line.type === "info") colorClass = "text-[#519aba]";

            return (
              <div key={index} className={`leading-relaxed ${colorClass} break-words`}>
                {line.text}
              </div>
            );
          })}
          <div ref={streamBottomRef} />
        </div>
      </div>

    </div>
  );
}