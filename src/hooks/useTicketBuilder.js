import { useState, useCallback } from 'react';

const initialTicketState = {
  intent: '',
  outcome: '',
  scope: {
    included: [],
    excluded: []
  },
  successCriteria: [],
  constraints: [],
  ticketType: 'story',
  workTypes: [],
  format: 'structured'
};

export function useTicketBuilder() {
  const [ticket, setTicket] = useState(initialTicketState);

  const updateTicket = useCallback((updates) => {
    setTicket(prev => {
      const newTicket = { ...prev };

      // Handle each possible update field
      if (updates.intent !== undefined && updates.intent !== null) {
        newTicket.intent = updates.intent;
      }

      if (updates.outcome !== undefined && updates.outcome !== null) {
        newTicket.outcome = updates.outcome;
      }

      if (updates.scope !== undefined && updates.scope !== null) {
        newTicket.scope = {
          included: updates.scope.included || prev.scope.included,
          excluded: updates.scope.excluded || prev.scope.excluded
        };
      }

      if (updates.successCriteria !== undefined && updates.successCriteria !== null) {
        // Append new criteria rather than replacing
        if (Array.isArray(updates.successCriteria)) {
          const existingCriteria = new Set(prev.successCriteria);
          const newCriteria = updates.successCriteria.filter(c => !existingCriteria.has(c));
          newTicket.successCriteria = [...prev.successCriteria, ...newCriteria];
        }
      }

      if (updates.constraints !== undefined && updates.constraints !== null) {
        // Append new constraints rather than replacing
        if (Array.isArray(updates.constraints)) {
          const existingConstraints = new Set(prev.constraints);
          const newConstraints = updates.constraints.filter(c => !existingConstraints.has(c));
          newTicket.constraints = [...prev.constraints, ...newConstraints];
        }
      }

      if (updates.ticketType !== undefined) {
        newTicket.ticketType = updates.ticketType;
      }

      if (updates.workTypes !== undefined) {
        newTicket.workTypes = updates.workTypes;
      }

      return newTicket;
    });
  }, []);

  const resetTicket = useCallback(() => {
    setTicket(initialTicketState);
  }, []);

  return {
    ticket,
    updateTicket,
    resetTicket
  };
}
