import React from 'react';
import { Bot, User } from 'lucide-react';

export default function MessageBubble({ role, content, timestamp, isStreaming = false }) {
  const isAssistant = role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isAssistant
          ? 'bg-indigo-100 text-indigo-600'
          : 'bg-gray-100 text-gray-600'
      }`}>
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[80%] ${isAssistant ? '' : 'text-right'}`}>
        <div className={`inline-block px-4 py-3 rounded-2xl ${
          isAssistant
            ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
            : 'bg-indigo-600 text-white rounded-tr-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap">
            {content}
            {isStreaming && isAssistant && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </p>
        </div>
        {timestamp && (
          <p className={`text-xs text-gray-400 mt-1 ${isAssistant ? '' : 'text-right'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
