import { useState, useCallback } from 'react';
import { sendChat } from './sendChat';
import { payloadToText } from './formatters';
import { getSessionId } from './store';
import { getContextForUser, saveContextForUser } from './conversation/state';
import { parseUserMessage } from './conversation/parser';
import { needsFollowUp, generateFollowUpQuestion, generateCompletionResponse, handleSmallTalk } from './conversation/policies';
import { resetChatForUser } from './store';
import { getActiveUserId } from './userUtils';

const DEBUG_CHAT = import.meta.env.VITE_DEBUG_CHAT === '1';

const debugLog = (event: string, data?: any) => {
  if (DEBUG_CHAT) {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} ${event}`, data);
  }
};

export function useDemoAI() {
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string, messages: any[], setMessages: (fn: (prev: any[]) => any[]) => void): Promise<void> => {
    if (!content.trim()) return;

    debugLog('submit:start', { contentLength: content.length });

    // Get stable sessionId and userId
    const sessionId = getSessionId();
    const userId = getActiveUserId();
    debugLog('session:current', { sessionId: sessionId.slice(-8), userId }); // Log last 8 chars for privacy

    // Get current conversation context
    const currentContext = getContextForUser(userId);
    
    // Parse user message to update context and detect small-talk
    const parseResult = parseUserMessage(content.trim(), currentContext);
    const { smallTalk, ...newContext } = parseResult;
    saveContextForUser(userId, newContext);

    // Immediately append user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: content.trim(),
      createdAt: Date.now(),
    };

    setMessages(prev => {
      debugLog('store:append:user', { contentLength: content.length });
      return [...prev, userMessage];
    });

    setIsTyping(true);

    try {
      // Handle small-talk without network calls
      if (smallTalk) {
        let responseContent: string;
        
        // Special handling for reset confirmation
        if (smallTalk === 'reset') {
          responseContent = handleSmallTalk(smallTalk, newContext);
        } else if (smallTalk === 'affirm' && messages.length > 1) {
          // Check if this is confirming a reset
          const lastMessage = messages[messages.length - 2]; // -1 is current user message, -2 is last assistant
          if (lastMessage?.content?.includes('Reset chat for this user')) {
            // Execute reset
            const welcomeMessages = resetChatForUser(userId);
            setMessages(() => welcomeMessages);
            setIsTyping(false);
            setIsStreaming(false);
            return;
          } else {
            responseContent = handleSmallTalk(smallTalk, newContext, lastMessage?.content);
          }
        } else {
          responseContent = handleSmallTalk(smallTalk, newContext);
        }
        
        // Create small-talk response without API call
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: responseContent,
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant', { contentLength: responseContent.length, type: 'smalltalk' });
          return [...prev, assistantMessage];
        });

        return; // Don't call API for small-talk
      }

      // Check if we need a follow-up question (non-small-talk)
      if (needsFollowUp(newContext)) {
        const followUpQuestion = generateFollowUpQuestion(newContext);
        
        // Create follow-up response without API call
        const followUpMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: followUpQuestion,
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant', { contentLength: followUpQuestion.length, type: 'followup' });
          return [...prev, followUpMessage];
        });

        return; // Don't call API for follow-ups
      }

      // Determine if we should stream
      const shouldStream = import.meta.env.VITE_AI_STREAM === '1';
      
      debugLog('net:start', { 
        mode: shouldStream ? 'SSE' : 'JSON',
        payloadShape: { sessionId: 'provided', message: 'provided' }
      });

      // Use the unified sendChat helper
      const response = await sendChat({
        sessionId,
        message: content.trim(),
        stream: shouldStream,
      });

      debugLog('net:status', { 
        status: 200,
        hasPayload: !!response,
        schemaVersion: response.schemaVersion 
      });

      // Convert response to text using existing formatter, then enhance with conversation logic
      const baseContent = payloadToText(response);
      const enhancedContent = generateCompletionResponse(newContext, baseContent);

      // Add assistant message
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: enhancedContent,
        metadata: { payload: response, context: newContext },
        createdAt: Date.now(),
      };

      setMessages(prev => {
        debugLog('store:append:assistant', { contentLength: enhancedContent.length });
        return [...prev, assistantMessage];
      });

    } catch (error) {
      debugLog('net:error', { error: error instanceof Error ? error.message : error });
      
      // Add non-destructive error message (keep history intact)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'I encountered a temporary network issue. Please try again.',
        createdAt: Date.now(),
      };

      setMessages(prev => {
        debugLog('store:append:assistant', { contentLength: 0, type: 'error' });
        return [...prev, errorMessage];
      });
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  }, []);

  return {
    sendMessage,
    isTyping,
    isStreaming,
  };
}
