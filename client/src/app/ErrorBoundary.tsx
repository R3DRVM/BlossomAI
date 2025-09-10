import React from "react";

export default class ErrorBoundary extends React.Component<{children: React.ReactNode},{err?: Error}> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: any) { console.error("[blossom] runtime-error", err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    // Dev-only fallback. Compact, neutral; only shown on crash.
    return (
      <div className="p-4 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
        <div className="font-medium mb-2">Blossom — runtime error</div>
        <pre className="overflow-auto text-xs">
          {String(this.state.err?.message || this.state.err)}
        </pre>
      </div>
    );
  }
}





