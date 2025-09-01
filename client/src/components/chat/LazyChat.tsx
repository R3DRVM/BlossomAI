import React, { Suspense } from 'react';
import { ErrorBoundary } from '../dev/ErrorBoundary';

// Lazy-loaded chat component
const ChatSidebar = React.lazy(() => import('../terminal/ChatSidebar').then(module => ({ default: module.ChatSidebar })));

// Chat error fallback
function ChatErrorFallback() {
  return (
    <aside className="chat-sidebar">
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-xs">💬</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Chat temporarily unavailable
          </p>
        </div>
      </div>
    </aside>
  );
}

// Chat loading fallback
function ChatLoadingFallback() {
  return (
    <aside className="chat-sidebar">
      <div className="h-full flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </aside>
  );
}

export function LazyChat() {
  return (
    <ErrorBoundary fallback={<ChatErrorFallback />}>
      <Suspense fallback={<ChatLoadingFallback />}>
        <ChatSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
