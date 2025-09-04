import React from "react";

type Props = { children: string; className?: string };
export default function Snippet({ children, className }: Props) {
  return (
    <pre className={`rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-xs overflow-x-auto ${className ?? ""}`}>
      <code>{children}</code>
    </pre>
  );
}

