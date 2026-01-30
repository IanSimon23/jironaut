import React from 'react';
import ChatPanel from './ChatPanel';
import TicketPanel from './TicketPanel';
import { useCoachConversation } from '../../hooks/useCoachConversation';
import { useTicketBuilder } from '../../hooks/useTicketBuilder';

export default function CoachView() {
  const { ticket, updateTicket, resetTicket } = useTicketBuilder();
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    resetConversation,
    currentSection
  } = useCoachConversation(updateTicket);

  const handleReset = () => {
    resetConversation();
    resetTicket();
  };

  return (
    <div className="h-[calc(100vh-88px)] flex">
      {/* Chat Panel - Left Side */}
      <div className="w-1/2 border-r border-gray-200 bg-white">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          error={error}
          onSendMessage={sendMessage}
          onReset={handleReset}
          currentSection={currentSection}
        />
      </div>

      {/* Ticket Panel - Right Side */}
      <div className="w-1/2 bg-gray-50">
        <TicketPanel
          ticket={ticket}
          currentSection={currentSection}
        />
      </div>
    </div>
  );
}
