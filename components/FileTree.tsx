"use client";

import { useState } from "react";
import { Folder, FileCode, Plus, FolderPlus, Edit2, Trash2, FolderOpen, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";

interface FileTreeProps {
  activeFile: string;
  setActiveFile: (name: string) => void;
  onFileOpen: (name: string, content: string, handle?: any) => void;
}

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  handle?: any; 
  parentHandle?: any; 
  children?: FileNode[];
  isOpen?: boolean;
}

export default function FileTree({ activeFile, setActiveFile, onFileOpen }: FileTreeProps) {
  // 🛠️ START COMPLETELY EMPTY
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [rootHandle, setRootHandle] = useState<any>(null); 
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const updateNodeState = (nodeList: FileNode[], targetId: string, updater: (n: FileNode) => FileNode): FileNode[] => {
    return nodeList.map(node => {
      if (node.id === targetId) return updater(node);
      if (node.children) return { ...node, children: updateNodeState(node.children, targetId, updater) };
      return node;
    });
  };

  const handleNodeClick = async (node: FileNode) => {
    if (node.type === "file") {
      setActiveFile(node.name);
      if (typeof onFileOpen !== "function") return; 
      
      if (node.handle) {
        try {
          const file = await node.handle.getFile();
          const text = await file.text();
          onFileOpen(node.name, text, node.handle);
        } catch (error) {
          console.error("Failed to read file:", error);
        }
      }
    } else if (node.type === "folder") {
      if (!node.isOpen && node.handle && (!node.children || node.children.length === 0)) {
        try {
          const newChildren: FileNode[] = [];
          for await (const entry of node.handle.values()) {
            newChildren.push({
              id: node.id + "/" + entry.name + Date.now(),
              name: entry.name,
              type: entry.kind === "file" ? "file" : "folder",
              handle: entry,
              parentHandle: node.handle, 
              children: [],
              isOpen: false
            });
          }
          newChildren.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === "folder" ? -1 : 1;
          });
          setNodes(prev => updateNodeState(prev, node.id, n => ({ ...n, isOpen: true, children: newChildren })));
        } catch (error) {
          console.error("Failed to read directory subtree:", error);
        }
      } else {
        setNodes(prev => updateNodeState(prev, node.id, n => ({ ...n, isOpen: !n.isOpen })));
      }
    }
  };

  const handleCreate = async (type: "file" | "folder") => {
    if (!rootHandle) return;

    try {
      const defaultName = type === "file" ? `new_file_${Date.now()}.tf` : `New_Folder_${Date.now()}`;
      
      const newHandle = type === "file" 
        ? await rootHandle.getFileHandle(defaultName, { create: true })
        : await rootHandle.getDirectoryHandle(defaultName, { create: true });

      const newNode: FileNode = {
        id: Date.now().toString(),
        name: defaultName,
        type: type,
        handle: newHandle,
        parentHandle: rootHandle
      };

      setNodes(prev => [newNode, ...prev]);
      setEditingId(newNode.id);
      setEditName(newNode.name);
    } catch (error) {
      console.error("Failed to create item on disk:", error);
    }
  };

  const handleDelete = async (node: FileNode, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (node.parentHandle && node.handle) {
      try {
        await node.parentHandle.removeEntry(node.name, { recursive: true });
        
        const removeNode = (list: FileNode[]): FileNode[] => {
          return list.filter(n => n.id !== node.id).map(n => ({
            ...n,
            children: n.children ? removeNode(n.children) : []
          }));
        };
        setNodes(prev => removeNode(prev));
      } catch (error) {
        console.error("Failed to delete item from disk:", error);
        alert("Delete failed. Check OS permissions.");
      }
    }
  };

  const startRename = (node: FileNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingId(node.id);
    setEditName(node.name);
  };

  const saveRename = async (node: FileNode) => {
    if (!node.parentHandle || !node.handle || editName === node.name) {
      setEditingId(null);
      return;
    }

    try {
      if (node.type === "file") {
        const file = await node.handle.getFile();
        const content = await file.text();
        
        const newHandle = await node.parentHandle.getFileHandle(editName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(content);
        await writable.close();

        await node.parentHandle.removeEntry(node.name);

        setNodes(prev => updateNodeState(prev, node.id, n => ({ ...n, name: editName, handle: newHandle })));
      } else {
        alert("Renaming directories directly via browser API is currently not fully supported. Please rename files only.");
      }
    } catch (error) {
      console.error("Rename failed on disk:", error);
    }
    
    setEditingId(null);
  };

  const handleOpenFolder = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' }); 
      setRootHandle(dirHandle);
      
      const newNodes: FileNode[] = [];
      for await (const entry of dirHandle.values()) {
        newNodes.push({
          id: entry.name + Date.now().toString(),
          name: entry.name,
          type: entry.kind === "file" ? "file" : "folder",
          handle: entry,
          parentHandle: dirHandle 
        });
      }
      newNodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      });
      setNodes(newNodes);
    } catch (error) {
      console.log("Folder selection cancelled or permission denied.");
    }
  };

  const getIcon = (name: string, type: "file" | "folder", isOpen?: boolean) => {
    if (type === "folder") {
      return (
        <div className="flex items-center">
          {isOpen ? <ChevronDown size={14} className="text-[#cccccc] mr-1" /> : <ChevronRight size={14} className="text-[#cccccc] mr-1" />}
          <Folder size={14} className="text-[#dcb67a]" />
        </div>
      );
    }
    if (name.endsWith(".tf")) return <FileCode size={14} className="text-[#e06c75] ml-4" />;
    if (name.includes("policy") || name.includes("security")) return <ShieldCheck size={14} className="text-[#4caf50] ml-4" />;
    return <FileCode size={14} className="text-[#519aba] ml-4" />;
  };

  const renderTree = (nodeList: FileNode[], depth: number = 0) => {
    return nodeList.map((node) => (
      <div key={node.id}>
        <div 
          onClick={() => handleNodeClick(node)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded cursor-pointer transition ${
            activeFile === node.name && node.type === "file" ? "bg-[#37373d] text-white" : "hover:bg-[#2a2a2b] text-[#cccccc]"
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {getIcon(node.name, node.type, node.isOpen)}
            {editingId === node.id ? (
              <input 
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveRename(node)}
                onKeyDown={(e) => e.key === "Enter" && saveRename(node)}
                className="bg-[#3c3c3c] text-white px-1 outline-none border border-[#007acc] w-full ml-1"
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>
          <div className="hidden group-hover:flex items-center gap-1.5 opacity-70">
            <button onClick={(e) => startRename(node, e)} className="hover:text-white outline-none"><Edit2 size={12} /></button>
            <button onClick={(e) => handleDelete(node, e)} className="hover:text-[#f44336] outline-none"><Trash2 size={12} /></button>
          </div>
        </div>
        {node.type === "folder" && node.isOpen && node.children && (
          <div>{renderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#2b2b2b] flex flex-col text-xs select-none">
      <div className="flex items-center justify-between p-3">
        <span className="uppercase font-bold tracking-wider text-[#bbbbbb] text-[10px]">Explorer</span>
        <div className="flex items-center gap-2 text-[#cccccc]">
          {/* 🛠️ ONLY SHOW ADD BUTTONS IF A FOLDER IS OPEN */}
          {rootHandle && (
            <>
              <button title="New File" onClick={() => handleCreate("file")} className="hover:text-white transition outline-none"><Plus size={14} /></button>
              <button title="New Folder" onClick={() => handleCreate("folder")} className="hover:text-white transition outline-none"><FolderPlus size={14} /></button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 overflow-y-auto pb-4 h-full">
        {/* 🛠️ BIG BLUE BUTTON EMPTY STATE */}
        {!rootHandle ? (
          <div className="flex flex-col items-center justify-center p-6 text-center mt-10 gap-4">
            <p className="text-[#858585] text-xs leading-relaxed">You have not yet opened a folder.</p>
            <button 
              onClick={handleOpenFolder} 
              className="bg-[#007acc] hover:bg-[#0062a3] text-white py-1.5 px-4 rounded text-xs font-semibold transition"
            >
              Open Folder
            </button>
          </div>
        ) : (
          renderTree(nodes, 0)
        )}
      </div>
    </div>
  );
}