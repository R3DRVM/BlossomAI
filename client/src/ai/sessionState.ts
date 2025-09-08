/**
 * Session state management for conversation flow
 */

import { ConversationState } from './intents';

const K = (u: string) => `blossom.session.${u}`;

export function loadSession(userId: string): ConversationState {
  try { 
    return JSON.parse(localStorage.getItem(K(userId)) || '{"slots":{}}'); 
  } catch { 
    return { slots: {} }; 
  }
}

export function saveSession(userId: string, s: ConversationState) {
  localStorage.setItem(K(userId), JSON.stringify(s));
}

export function clearSession(userId: string) {
  localStorage.removeItem(K(userId));
}



