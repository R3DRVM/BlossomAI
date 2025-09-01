import { useState, useEffect } from 'react';
import { safeHydrate, persistMessages, resetChatForUser, ChatMessage } from './store';
import { getActiveUserId, onUserChange } from './userUtils';
import { useDemoAI } from './useDemoAI';

const DEBUG_CHAT = import.meta.env.VITE_DEBUG_CHAT === '1';

export function useChatStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { sendMessage: sendAIMessage, isTyping, isStreaming } = useDemoAI();

  // Load messages from store on mount and user change
  useEffect(() => {
    if (DEBUG_CHAT) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} panel:mount`);
    }

    const userId = getActiveUserId();
    setCurrentUserId(userId);

    const loadMessages = (targetUserId: string) => {
      const storedMessages = safeHydrate(targetUserId);
      if (DEBUG_CHAT) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} messages.length:before`, 
          storedMessages.length, { userId: targetUserId });
      }
      setMessages(storedMessages);
      setIsLoading(false);
    };

    loadMessages(userId);

    // Listen for user changes
    const userChangeCleanup = onUserChange((newUserId) => {
      if (newUserId !== currentUserId) {
        setCurrentUserId(newUserId);
        loadMessages(newUserId);
      }
    });

    // Listen for storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('blossom.chat.history.')) {
        const targetUserId = e.key.split('.').pop();
        if (targetUserId === currentUserId) {
          loadMessages(currentUserId);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      if (DEBUG_CHAT) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} panel:unmount`);
      }
      window.removeEventListener('storage', handleStorageChange);
      userChangeCleanup();
    };
  }, [currentUserId]);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0 && !isLoading && currentUserId) {
      persistMessages(messages, currentUserId);
    }
  }, [messages, isLoading, currentUserId]);

  const sendMessage = async (content: string) => {
    if (DEBUG_CHAT) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} messages.length:before`, messages.length);
    }
    
    // Use the AI hook to send the message, passing current messages and setter
    await sendAIMessage(content, messages, setMessages);
    
    if (DEBUG_CHAT) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} messages.length:after`, 'will-update-in-effect');
    }
  };

  const resetChat = () => {
    const welcomeMessages = resetChatForUser(currentUserId);
    setMessages(welcomeMessages);
  };

  return {
    messages,
    isLoading,
    isTyping,
    isStreaming,
    sendMessage,
    resetChat,
  };
}