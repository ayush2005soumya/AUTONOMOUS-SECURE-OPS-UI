"use client";

import { useState, useEffect } from "react";
import FileTree from "@/components/FileTree";
import CodeWorkspace from "@/components/CodeWorkspace";
import PipelineConsole from "@/components/PipelineConsole";

export interface LogEntry {
  text: string;
  type: "info" | "success" | "warning" | "error";
}

export interface OpenFile {
  name: string;
  content: string;
  handle?: any; 
}

export default function IDEWorkspace() {
  const [activeFile, setActiveFile] = useState("");
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { text: "System initialized. OpenRouter models configured.", type: "info" },
    { text: "Ready for Git Push pipeline trigger.", type: "info" }
  ]);
  const [isAuditing, setIsAuditing] = useState(false);

  const activeCode = openFiles.find(f => f.name === activeFile)?.content || "";

  const handleFileOpen = (name: string, content: string, handle?: any) => {
    if (!openFiles.find(f => f.name === name)) {
      setOpenFiles(prev => [...prev, { name, content, handle }]);
    }
    setActiveFile(name);
  };

  const handleCloseFile = (name: string) => {
    const newFiles = openFiles.filter(f => f.name !== name);
    setOpenFiles(newFiles);
    if (activeFile === name) {
      setActiveFile(newFiles.length > 0 ? newFiles[newFiles.length - 1].name : "");
    }
  };

  const handleCodeChange = (name: string, newContent: string) => {
    setOpenFiles(prev => prev.map(f => f.name === name ? { ...f, content: newContent } : f));
  };

  // 🛠️ ISOLATED SAVE LOGIC
  const flushFilesToDisk = async () => {
    let successCount = 0;
    for (const file of openFiles) {
      if (file.handle) {
        try {
          const writable = await file.handle.createWritable();
          await writable.write(file.content);
          await writable.close();
          successCount++;
        } catch (err) {
          console.error(`Failed to write ${file.name} to disk:`, err);
          setLogs(prev => [...prev, { text: `✗ Write permission denied for ${file.name}.`, type: "error" }]);
        }
      }
    }
    if (successCount > 0) {
      setLogs(prev => [...prev, { text: `💾 Local Sync: Successfully saved ${successCount} file(s) to physical drive.`, type: "success" }]);
    }
  };

  // 🛠️ RESTORED KEYBOARD LISTENER (Only for saving to disk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        flushFilesToDisk();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openFiles]);

  const triggerAuditPipeline = async () => {
    if (isAuditing || !activeCode) return;
    setIsAuditing(true);

    // 🛠️ REMOVED flushFilesToDisk() FROM HERE
    setLogs(prev => [...prev, { text: "🚀 Git Push event completed. Initializing Jenkins CI/CD job listener...", type: "info" }]);

    const simulateLog = (text: string, type: "info" | "success" | "warning" | "error", delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setLogs((prev) => [...prev, { text, type }]);
          resolve();
        }, delay);
      });
    };

    await simulateLog("🕵️ Intent Check: Validating infrastructure context via qwen3-next-80b...", "info", 800);
    await simulateLog("🛡️ Pre-flight Guardrails: Executing static validation regex maps...", "info", 600);
    await simulateLog("📚 Policy RAG: Extracting corporate semantic definitions via nvidia-llama-nemotron...", "info", 900);
    await simulateLog("🧠 Reasoning Audit: Running threat evaluation model via gpt-oss-120b...", "warning", 1200);
    await simulateLog("🚨 POLICY VULNERABILITY DETECTED: S3 Bucket contains public-read ACL permissions.", "error", 400);
    await simulateLog("🦾 Acting Agent: Rewriting secure code configuration to match compliance standards...", "info", 1000);

    const secureCode = `resource "aws_s3_bucket" "rnm_data" {\n  bucket = "rnm-enterprise-financial-vault"\n  \n  # ✅ Public access removed by Gatekeeper Agent\n  # acl  = "public-read" \n\n  tags = {\n    Environment = "Production"\n  }\n}\n\nresource "aws_s3_bucket_public_access_block" "rnm_data_privacy" {\n  bucket                  = aws_s3_bucket.rnm_data.id\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}`;
    
    handleCodeChange(activeFile, secureCode);
    setLogs((prev) => [...prev, { text: "✅ Auto-Remediation Complete: File updated securely inside your workspace.", type: "success" }]);
    setIsAuditing(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans select-none">
      <div className="flex items-center justify-between h-9 px-3 bg-[#3c3c3c] border-b border-[#2b2b2b] text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-white">RNM DevSecOps Gatekeeper IDE</span>
          <span className="text-[#858585]">Workspace &gt; dev-infrastructure</span>
        </div>
        <div className="text-[#858585]">Status: {isAuditing ? "⚡ Executing Pipeline..." : "🟢 Idle"}</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FileTree 
          activeFile={activeFile} 
          setActiveFile={setActiveFile} 
          onFileOpen={handleFileOpen} 
        />
        <div className="flex flex-col flex-1 relative bg-[#1e1e1e]">
          <CodeWorkspace 
            openFiles={openFiles}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            closeFile={handleCloseFile}
            updateContent={handleCodeChange}
            onSave={flushFilesToDisk} // 🛠️ Passed the isolated save function
          />
          <PipelineConsole 
            logs={logs} 
            isAuditing={isAuditing}
            onTriggerPipeline={triggerAuditPipeline}
          />
        </div>
      </div>
    </div>
  );
}