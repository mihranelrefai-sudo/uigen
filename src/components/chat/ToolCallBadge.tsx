"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function getLabel(tool: ToolInvocation): string {
  const args = (tool as { toolName: string; args?: Record<string, string> }).args ?? {};
  const file = args.path ? args.path.split("/").pop() ?? args.path : undefined;
  const isDone = tool.state === "result";

  if (tool.toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return file ? (isDone ? `Created ${file}` : `Creating ${file}`) : (isDone ? "Created file" : "Creating file");
      case "str_replace":
      case "insert":
        return file ? (isDone ? `Edited ${file}` : `Editing ${file}`) : (isDone ? "Edited file" : "Editing file");
      case "view":
        return file ? (isDone ? `Read ${file}` : `Reading ${file}`) : (isDone ? "Read file" : "Reading file");
      case "undo_edit":
        return file ? (isDone ? `Undid edit in ${file}` : `Undoing edit in ${file}`) : (isDone ? "Undid edit" : "Undoing edit");
    }
  }

  if (tool.toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newFile = args.new_path ? args.new_path.split("/").pop() ?? args.new_path : undefined;
        return newFile ? (isDone ? `Renamed to ${newFile}` : `Renaming to ${newFile}`) : (isDone ? "Renamed file" : "Renaming file");
      }
      case "delete":
        return file ? (isDone ? `Deleted ${file}` : `Deleting ${file}`) : (isDone ? "Deleted file" : "Deleting file");
    }
  }

  return isDone ? "Done" : "Working...";
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const isDone = tool.state === "result" && (tool as { result?: unknown }).result !== undefined;
  const label = getLabel(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
