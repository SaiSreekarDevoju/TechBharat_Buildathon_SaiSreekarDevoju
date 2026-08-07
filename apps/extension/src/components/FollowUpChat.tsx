import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SummaryResponse, UserOptions, CaptureMode } from '@lumen/shared';
import { requestFollowUp } from '../lib/api.js';

interface FollowUpChatProps {
  summary: SummaryResponse;
  capturedBlocks: any;
  options: UserOptions;
  captureMode?: CaptureMode;
  imageDataUrl?: string;
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  summary,
  capturedBlocks,
  options,
  captureMode = 'page',
  imageDataUrl,
  messages = [],
  onUpdateMessages,
}) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(false);

  // Auto-scroll on mount or when messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages.length]);

  // Suggested quick question chips
  const suggestedQuestions = captureMode === 'selection'
    ? ['Summarize this selection simply.', 'What are the key facts?', 'Which numbers are mentioned?', 'What decisions or risks appear?']
    : captureMode === 'region'
      ? ['What does this visual show?', 'Describe the main trend.', 'Which values stand out?', 'Are there visible anomalies?']
      : ['What are the main risks?', 'What are the key conclusions?', 'List every deadline.', 'Which numbers matter most?'];

  const checkIfNearBottom = () => {
    const el = containerRef.current;
    if (!el) return false;
    const threshold = 60;
    const isNear = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    isNearBottomRef.current = isNear;
    setShowJumpToBottom(!isNear && messages.length > 0);
    return isNear;
  };

  const handleScroll = () => {
    checkIfNearBottom();
  };

  const scrollToBottom = (smooth = true) => {
    if (bottomSentinelRef.current) {
      bottomSentinelRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
      setShowJumpToBottom(false);
    }
  };

  // Helper to parse and extract human readable text if model returned raw JSON dictionary
  const formatTextResponse = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        if (typeof obj.answer === 'string') return obj.answer;
        if (typeof obj.response === 'string') return obj.response;
        if (typeof obj.text === 'string') return obj.text;
        if (Array.isArray(obj.risks) && obj.risks[0]?.text) return obj.risks[0].text;
        if (Array.isArray(obj.keyPoints) && obj.keyPoints[0]?.text) return obj.keyPoints[0].text;
      } catch {
        // use raw if JSON parse fails
      }
    }
    return raw;
  };

  const handleSubmit = async (qText?: string) => {
    const questionText = qText || input.trim();
    if (!questionText || isStreaming) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toISOString(),
    };

    const updatedList = [...messages, userMessage, assistantMessage];
    onUpdateMessages(updatedList);
    setInput('');
    setIsStreaming(true);
    isNearBottomRef.current = true;

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
      scrollToBottom(true);
    }, 20);

    try {
      let accumulated = '';
      await requestFollowUp({
        question: questionText,
        contextSummary: summary,
        capturedBlocks,
        captureMode,
        imageDataUrl,
        options: { ...options, language: (summary.source?.language || options.language) as any },
        onChunk: (chunk: string) => {
          accumulated += chunk;
          const cleanedText = formatTextResponse(accumulated);
          onUpdateMessages(
            updatedList.map((msg) => (msg.id === assistantMsgId ? { ...msg, text: cleanedText } : msg))
          );
        },
      });
    } catch (err: any) {
      onUpdateMessages(
        updatedList.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, text: `Error: ${err.message || 'Failed to answer question.'}` } : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lemon-primary)', letterSpacing: '0.05em' }}>
        FOLLOW-UP CHAT
      </div>

      {/* Suggested chips if no messages yet */}
      {messages.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(q)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '6px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--lemon-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              💬 {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat scroll container */}
      {messages.length > 0 && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative',
            paddingRight: '4px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: msg.sender === 'user' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: msg.sender === 'user' ? '1px solid var(--lemon-primary)' : '1px solid var(--border-color)',
                color: msg.sender === 'user' ? 'var(--lemon-primary)' : 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text || (msg.sender === 'assistant' ? 'Thinking…' : '')}
            </div>
          ))}
          <div ref={bottomSentinelRef} />
        </div>
      )}

      {/* Floating Jump to latest button */}
      {showJumpToBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          style={{
            alignSelf: 'center',
            background: 'var(--lemon-primary)',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          ↓ Jump to latest
        </button>
      )}

      {/* Input box */}
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="Ask about this page..."
          disabled={isStreaming}
          style={{ flex: 1, paddingRight: '40px' }}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={isStreaming || !input.trim()}
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isStreaming || !input.trim() ? 'var(--bg-tertiary)' : 'var(--lemon-primary)',
            color: isStreaming || !input.trim() ? 'var(--text-muted)' : '#0A0A0A',
            border: 'none',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          ➔
        </button>
      </div>
    </div>
  );
};
