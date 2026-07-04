"use client";

import { useState, useEffect, useRef } from "react";
import FileTree from "@/components/FileTree";
import CodeWorkspace from "@/components/CodeWorkspace";
import PipelineConsole from "@/components/PipelineConsole";
import { PushConfig } from "@/components/PipelineConsole"; 

export interface LogEntry {
  text: string;
  type: "info" | "success" | "warning" | "error";
}

export interface OpenFile {
  name: string;
  content: string;
  handle?: any;
}

export default function IDEWorkspaceContent() {
  const [activeFile, setActiveFile] = useState("");
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: "System initialized. OpenRouter models configured.", type: "info" },
    { text: "Ready for Git Push pipeline trigger.", type: "info" }
  ]);
  const [isAuditing, setIsAuditing] = useState(false);

  const activeCode = openFiles.find(f => f.name === activeFile)?.content || "";
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

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
          setLogs(prev => [...prev, { text: `✗ Write permission denied for ${file.name}.`, type: "error" }]);
        }
      }
    }
    if (successCount > 0) {
      setLogs(prev => [...prev, { text: `💾 Local Sync: Saved ${successCount} file(s).`, type: "success" }]);
    }
  };

  const triggerAuditPipeline = async (config: PushConfig) => {
    if (isAuditing || !activeCode) return;
    setIsAuditing(true);

    const initialUILogs: LogEntry[] = [
      { text: "🚀 Git Push event initiated. Compiling payload...", type: "info" }
    ];
    setLogs(initialUILogs);

    try {
      const response = await fetch('/api/jenkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, tfContent: activeCode })
      });

      if (!response.ok) throw new Error("Failed to trigger Jenkins API");

      initialUILogs.push({ text: "✅ Payload delivered. Establishing live connection...", type: "success" });
      setLogs([...initialUILogs]);

      setTimeout(() => {
        pollingRef.current = setInterval(async () => {
          try {
            const logRes = await fetch('/api/jenkins/logs');
            if (!logRes.ok) return;
            
            const rawLogs = await logRes.text();
            const logLines = rawLogs.split('\n').filter(line => line.trim().length > 0);
            
            const formattedLogs: LogEntry[] = logLines.map(line => ({
              text: line.replace(/\[\d+m/g, '').replace(/\[0m/g, ''),
              type: line.includes('🚨') || line.includes('Error') ? 'error' : 
                    line.includes('✅') || line.includes('Passed') ? 'success' : 
                    line.includes('⚠️') ? 'warning' : 'info'
            }));
            
            setLogs([...initialUILogs, ...formattedLogs]);

            const isFinished = rawLogs.includes("Finished: SUCCESS") || 
                               rawLogs.includes("Finished: FAILURE") || 
                               rawLogs.includes("Finished: ABORTED");

            if (isFinished) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              
              if (rawLogs.includes("Finished: SUCCESS")) {
                setLogs(prev => [...prev, { text: "📡 Pipeline Complete. Syncing remediated code...", type: "info" }]);
                
                const cacheBuster = new Date().getTime();
                const codeRes = await fetch(`/api/github/file?t=${cacheBuster}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    username: config.username,
                    targetRepo: config.targetRepo,
                    commitBranch: config.mergeBranch,
                    fileName: activeFile 
                  })
                });
                
                const codeData = await codeRes.json();
                if (codeData.code) {
                  handleCodeChange(activeFile, codeData.code);
                  setLogs(prev => [...prev, { text: "💾 Code successfully synced from GitHub!", type: "success" }]);
                }
              } else {
                setLogs(prev => [...prev, { text: "🚨 Pipeline stopped. Check logs above.", type: "error" }]);
              }
              setIsAuditing(false);
            }
          } catch (pollError) {
            console.error("Polling error:", pollError);
          }
        }, 2000); 
      }, 2000); 

    } catch (error: any) {
      setLogs(prev => [...prev, { text: `❌ Network Error: ${error.message}`, type: "error" }]);
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans select-none">
      <div className="flex items-center justify-between h-9 px-3 bg-[#3c3c3c] border-b border-[#2b2b2b] text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-white">RNM DevSecOps Gatekeeper IDE</span>
        </div>
        <div className="text-[#858585]">Status: {isAuditing ? "⚡ Executing Pipeline..." : "🟢 Idle"}</div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <FileTree activeFile={activeFile} setActiveFile={setActiveFile} onFileOpen={handleFileOpen} />
        <div className="flex flex-col flex-1 relative bg-[#1e1e1e]">
          <CodeWorkspace
            openFiles={openFiles}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            closeFile={handleCloseFile}
            updateContent={handleCodeChange}
            onSave={flushFilesToDisk}
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