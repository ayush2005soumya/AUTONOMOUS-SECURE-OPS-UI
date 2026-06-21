"use client";

import Editor from "@monaco-editor/react";
import { FileCode, Save, X, ShieldCheck } from "lucide-react";

interface CodeWorkspaceProps {
  openFiles: { name: string; content: string }[];
  activeFile: string;
  setActiveFile: (name: string) => void;
  closeFile: (name: string) => void;
  updateContent: (name: string, content: string) => void;
  onSave: () => void; // 🛠️ Restored onSave property
}

export default function CodeWorkspace({ openFiles, activeFile, setActiveFile, closeFile, updateContent, onSave }: CodeWorkspaceProps) {
  
  const getIcon = (name: string) => {
    if (name.includes("policy") || name.includes("security")) return <ShieldCheck size={14} className="text-[#4caf50]" />;
    if (name.endsWith(".tf")) return <FileCode size={14} className="text-[#e06c75]" />;
    return <FileCode size={14} className="text-[#519aba]" />;
  };

  const activeContent = openFiles.find(f => f.name === activeFile)?.content || "";

  if (openFiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#858585] flex-col gap-4">
        <FileCode size={48} className="opacity-20" />
        <p>No files open. Select a file from the explorer.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[50%] bg-[#1e1e1e] overflow-hidden">
      
      <div className="flex items-center justify-between h-9 bg-[#252526] border-b border-[#1e1e1e]">
        <div className="flex h-full overflow-x-auto no-scrollbar flex-1">
          {openFiles.map((file) => (
            <div 
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] h-full border-r border-[#1e1e1e] cursor-pointer text-xs transition-colors group ${
                activeFile === file.name 
                  ? "bg-[#1e1e1e] border-t-[2px] border-t-[#007acc] text-white" 
                  : "bg-[#2d2d2d] text-[#858585] border-t-[2px] border-t-transparent hover:bg-[#2a2a2b]"
              }`}
            >
              {getIcon(file.name)}
              <span className="truncate flex-1 select-none">{file.name}</span>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  closeFile(file.name);
                }}
                className={`p-0.5 rounded transition ${
                  activeFile === file.name ? "opacity-100 hover:bg-[#3c3c3c]" : "opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c]"
                }`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* 🛠️ Restored Global Save Button */}
        <button 
          onClick={onSave}
          className="flex items-center gap-1.5 mx-3 px-2 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded text-xs transition whitespace-nowrap"
        >
          <Save size={12} />
          <span>Save Local</span>
        </button>
      </div>

      <div className="flex-1 w-full pt-2">
        <Editor
          height="100%"
          language={activeFile.endsWith('.tf') ? 'hcl' : 'plaintext'}
          theme="vs-dark"
          value={activeContent}
          onChange={(val) => updateContent(activeFile, val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}