import { useState, useCallback, useRef } from 'react';

const INITIAL_MESSAGE = {
  id: 'initial',
  role: 'assistant',
  content: `Hi! I'm here to help you create a clear, well-structured ticket.

Let's start with the most important question:

**What problem are we trying to solve, or what opportunity are we pursuing?**

Tell me about the issue or need that's driving this work.`,
  timestamp: new Date().toISOString(),
  section: 'intent',
  isStreaming: false
};

export function useCoachConversation(onTicketUpdate) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState('intent');
  const currentSectionRef = useRef('intent');

  const runExtraction = useCallback(async (conversationMessages) => {
    try {
      const apiMessages = conversationMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          currentSection: currentSectionRef.current
        })
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.ticketUpdates && onTicketUpdate) {
        onTicketUpdate(data.ticketUpdates);
      }

      if (data.suggestedSection) {
        currentSectionRef.current = data.suggestedSection;
        setCurrentSection(data.suggestedSection);
      }
    } catch (err) {
      // Extraction failure is non-fatal — conversation continues,
      // ticket panel just doesn't update for this turn.
      // Next extraction re-extracts cumulatively.
      console.error('Extraction error (non-fatal):', err);
    }
  }, [onTicketUpdate]);

  const sendMessage = useCallback(async (content) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      section: currentSectionRef.current,
      isStreaming: false
    };

    const placeholderId = `assistant-${Date.now()}`;
    const placeholderMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      section: currentSectionRef.current,
      isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, placeholderMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      const allMessages = [...messages, userMessage];
      const conversationHistory = allMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          currentSection: currentSectionRef.current
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          if (data === '[DONE]') continue;

          try {
            const text = JSON.parse(data);
            if (typeof text === 'string' && text !== '[ERROR]') {
              fullText += text;
              const updatedText = fullText;
              setMessages(prev => prev.map(m =>
                m.id === placeholderId
                  ? { ...m, content: updatedText }
                  : m
              ));
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      // Finalize the message
      setMessages(prev => prev.map(m =>
        m.id === placeholderId
          ? { ...m, isStreaming: false }
          : m
      ));
      setIsStreaming(false);
      setIsLoading(false);

      // Fire extraction in background (no await)
      const finalMessages = [...allMessages, { role: 'assistant', content: fullText }];
      runExtraction(finalMessages);

    } catch (err) {
      console.error('Coach conversation error:', err);
      // Remove the placeholder message on failure
      setMessages(prev => prev.filter(m => m.id !== placeholderId));
      setError(err.message || 'Failed to get response. Please try again.');
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, [messages, runExtraction]);

  const resetConversation = useCallback(() => {
    setMessages([{
      ...INITIAL_MESSAGE,
      id: `initial-${Date.now()}`,
      timestamp: new Date().toISOString()
    }]);
    currentSectionRef.current = 'intent';
    setCurrentSection('intent');
    setIsStreaming(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    currentSection,
    sendMessage,
    resetConversation
  };
}
