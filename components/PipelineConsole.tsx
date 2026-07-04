"use client";

import { useState, useEffect, useRef } from "react";
import { Paintbrush, Server, ShieldAlert, CheckCircle, Mail, AlertTriangle, ArrowRight, GitPullRequest, X } from "lucide-react";
import { LogEntry } from "@/app/ide/ideWorkspaceContent";

export interface PushConfig {
  username: string;
  email: string;
  targetRepo: string;
  commitBranch: string;
  mergeBranch: string;
}

interface PipelineConsoleProps {
  logs: LogEntry[];
  isAuditing: boolean;
  onTriggerPipeline: (config: PushConfig) => void;
}

type PipelineStep = "idle" | "configuring" | "jenkins_active" | "awaiting_approval" | "complete";

export default function PipelineConsole({ logs, isAuditing, onTriggerPipeline }: PipelineConsoleProps) {
  const [pipelineState, setPipelineState] = useState<PipelineStep>("idle");
  const streamBottomRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<PushConfig>({
    username: "",
    email: "",
    targetRepo: "",
    commitBranch: "main",
    mergeBranch: "production"
  });

  // Sync internal state with external auditing status
  useEffect(() => {
    if (isAuditing && pipelineState === "idle") {
      setPipelineState("jenkins_active");
    } else if (!isAuditing && pipelineState === "jenkins_active") {
      setPipelineState("idle");
    }
  }, [isAuditing]);

  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handlePushSubmit = () => {
    setPipelineState("jenkins_active");
    onTriggerPipeline(formData);
  };

  return (
    <div className="h-64 bg-[#181818] border-t border-[#2b2b2b] flex font-mono text-xs select-none relative z-10">
      
      {/* LEFT PANEL: Interactive Actions */}
      <div className="w-1/3 border-r border-[#2b2b2b] bg-[#1e1e1e] p-4 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="text-[#858585] uppercase text-[10px] font-bold tracking-wider mb-3 flex items-center gap-1.5">
            <Server size={12} /> Pipeline Control Center
          </div>
          
          {pipelineState === "idle" && (
            <button
              onClick={() => setPipelineState("configuring")}
              className="w-full py-2.5 px-4 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-semibold flex items-center justify-center gap-2 transition"
            >
              <Paintbrush size={14} /> Initiate Git Push
            </button>
          )}

          {pipelineState === "configuring" && (
            <div className="space-y-2 animate-fadeIn bg-[#252526] p-3 rounded border border-[#3c3c3c]">
              <input 
                type="text" placeholder="GitHub Username" 
                className="w-full bg-[#1e1e1e] text-[#cccccc] p-1.5 border border-[#3c3c3c] rounded focus:border-[#007acc] outline-none"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
              <input 
                type="email" placeholder="Alert Email ID" 
                className="w-full bg-[#1e1e1e] text-[#cccccc] p-1.5 border border-[#3c3c3c] rounded focus:border-[#007acc] outline-none"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {/* FIX: Updated placeholder to guide correct usage */}
              <input 
                type="text" placeholder="Target Repo Name (e.g., dev-infra)" 
                className="w-full bg-[#1e1e1e] text-[#cccccc] p-1.5 border border-[#3c3c3c] rounded focus:border-[#007acc] outline-none"
                onChange={(e) => setFormData({...formData, targetRepo: e.target.value})}
              />
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Commit Branch" 
                  className="w-1/2 bg-[#1e1e1e] text-[#cccccc] p-1.5 border border-[#3c3c3c] rounded focus:border-[#007acc] outline-none"
                  onChange={(e) => setFormData({...formData, commitBranch: e.target.value})}
                />
                <input 
                  type="text" placeholder="Merge To (PR)" 
                  className="w-1/2 bg-[#1e1e1e] text-[#cccccc] p-1.5 border border-[#3c3c3c] rounded focus:border-[#007acc] outline-none"
                  onChange={(e) => setFormData({...formData, mergeBranch: e.target.value})}
                />
              </div>
              
              <button
                onClick={handlePushSubmit}
                className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex justify-center items-center gap-1.5 transition"
              >
                <GitPullRequest size={14} /> Send to DevSecOps Agent
              </button>
            </div>
          )}

          {(pipelineState === "jenkins_active" || pipelineState === "awaiting_approval") && (
            <div className="p-2 rounded bg-[#252526] border border-[#3c3c3c] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${pipelineState === "awaiting_approval" ? "bg-amber-500 animate-pulse" : "bg-blue-500 animate-spin"}`} />
              <span className="text-white capitalize font-semibold">
                {pipelineState === "jenkins_active" ? "AI Agent Auditing..." : "Awaiting Approval"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Log Stream */}
      <div className="flex-1 flex flex-col bg-[#151515] p-3 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
          {logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-2 ${
              log.type === "error" ? "text-red-400" : 
              log.type === "success" ? "text-emerald-400" : 
              log.type === "warning" ? "text-amber-400" : "text-[#cccccc]"
            }`}>
              {log.type === "error" && <ShieldAlert size={12} className="mt-0.5" />}
              {log.type === "success" && <CheckCircle size={12} className="mt-0.5" />}
              {log.type === "warning" && <AlertTriangle size={12} className="mt-0.5" />}
              <span className="break-all">{log.text}</span>
            </div>
          ))}
          <div ref={streamBottomRef} />
        </div>
      </div>

    </div>
  );
}