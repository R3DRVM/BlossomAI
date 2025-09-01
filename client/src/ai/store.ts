/**
 * Chat store with robust persistence and session management
 */

import { nanoid } from 'nanoid';
import { getActiveUserId } from './userUtils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  kind?: 'welcome' | 'text';  // new optional
  metadata?: any;
  createdAt: number;
}

interface ChatState {
  version: number;
  messages: ChatMessage[];
}

const getStorageKey = (userId: string) => `blossom.chat.history.${userId}`;
const getSessionKey = (userId: string) => `blossom.chat.session.${userId}`;
const MAX_MESSAGES = 80;

// Stable session ID - generate once and persist
let sessionId: string | null = null;

export function getSessionId(): string {
  if (sessionId) return sessionId;
  
  const userId = getActiveUserId();
  const sessionKey = getSessionKey(userId);
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(sessionKey);
      if (stored) {
        sessionId = stored;
      } else {
        sessionId = nanoid();
        localStorage.setItem(sessionKey, sessionId);
      }
    } else {
      sessionId = nanoid();
    }
  } catch (e) {
    // Fallback for storage errors
    sessionId = nanoid();
  }
  
  return sessionId;
}

export function safeHydrate(userId?: string): ChatMessage[] {
  const activeUserId = userId || getActiveUserId();
  const storageKey = getStorageKey(activeUserId);
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  
  if (debugEnabled) {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} hydrate:start`, { userId: activeUserId });
  }
  
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return getWelcomeMessage();
    }
    
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} hydrate:end`, 'no-storage-welcome');
      }
      return getWelcomeMessage();
    }

    const parsed: ChatState = JSON.parse(stored);
    if (!parsed.messages || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} hydrate:end`, 'empty-welcome');
      }
      return getWelcomeMessage();
    }

    if (debugEnabled) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} hydrate:end`, 
        `restored-${parsed.messages.length}-messages`);
    }
    
    return parsed.messages;
  } catch (error) {
    if (debugEnabled) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} hydrate:end`, 'parse-error-welcome');
    }
    // Clear corrupted data and return welcome (only if localStorage is available)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    return getWelcomeMessage();
  }
}

function getWelcomeMessage(): ChatMessage[] {
  return [{
    id: nanoid(),
    role: 'assistant',
    content: '', // Content will be handled by IntroCard component
    kind: 'welcome',
    createdAt: Date.now(),
  }];
}

export function persistMessages(messages: ChatMessage[], userId?: string): void {
  const activeUserId = userId || getActiveUserId();
  const storageKey = getStorageKey(activeUserId);
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    // Apply LRU cap
    const cappedMessages = messages.length > MAX_MESSAGES 
      ? messages.slice(-MAX_MESSAGES) 
      : messages;
    
    const state: ChatState = {
      version: 1,
      messages: cappedMessages,
    };
    
    localStorage.setItem(storageKey, JSON.stringify(state));
    
    if (debugEnabled) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} store:persist`, 
        `${cappedMessages.length}-messages`, { userId: activeUserId });
    }
  } catch (error) {
    if (debugEnabled) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} store:persist`, 'error');
    }
  }
}

export function appendMessage(messages: ChatMessage[], message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage[] {
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  
  const newMessage: ChatMessage = {
    id: nanoid(),
    createdAt: Date.now(),
    ...message,
  };
  
  const newMessages = [...messages, newMessage];
  
  if (debugEnabled) {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} store:append:${message.role}`, 
      { contentLength: message.content.length });
  }
  
  return newMessages;
}

// Dev guard against destructive clears
export function guardAgainstClear(action: string): void {
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  
  if (debugEnabled) {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} guard:blockClear`, action);
  }
  
  // Block the clear - don't execute it
}

// Explicit reset for user (bypasses guard)
export function resetChatForUser(userId?: string): ChatMessage[] {
  const activeUserId = userId || getActiveUserId();
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  
  if (debugEnabled) {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} reset:user:${activeUserId}`);
  }
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear all user-scoped storage
      localStorage.removeItem(getStorageKey(activeUserId));
      localStorage.removeItem(getSessionKey(activeUserId));
      localStorage.removeItem(`blossom.chat.context.${activeUserId}`);
    }
    
    // Reset session ID for this user
    sessionId = null;
    
    // Return fresh welcome message
    return getWelcomeMessage();
  } catch (error) {
    if (debugEnabled) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} reset:error`, error);
    }
    return getWelcomeMessage();
  }
}
