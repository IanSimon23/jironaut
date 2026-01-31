import React, { useState, useCallback } from 'react';
import { FileText, Target, Layers, CheckSquare, AlertCircle, Copy, Check } from 'lucide-react';

function formatTicketForJira(ticket) {
  const parts = [];

  if (ticket.intent?.trim()) {
    parts.push(`### Intent\n${ticket.intent.trim()}`);
  }

  if (ticket.outcome?.trim()) {
    parts.push(`### Outcome\n${ticket.outcome.trim()}`);
  }

  if (ticket.scope?.included?.length > 0 || ticket.scope?.excluded?.length > 0) {
    let scope = '### Scope';
    if (ticket.scope.included.length > 0) {
      scope += '\n**In scope:**\n' + ticket.scope.included.map(s => `- ${s}`).join('\n');
    }
    if (ticket.scope.excluded.length > 0) {
      scope += '\n\n**Out of scope:**\n' + ticket.scope.excluded.map(s => `- ${s}`).join('\n');
    }
    parts.push(scope);
  }

  if (ticket.successCriteria?.length > 0) {
    parts.push(
      '### Success Criteria\n' +
      ticket.successCriteria.map(c => `- [ ] ${c}`).join('\n')
    );
  }

  if (ticket.constraints?.length > 0) {
    parts.push(
      '### Constraints\n' +
      ticket.constraints.map(c => `- ${c}`).join('\n')
    );
  }

  return parts.join('\n\n');
}

export default function TicketPanel({ ticket, currentSection }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = formatTicketForJira(ticket);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [ticket]);

  const sections = [
    { key: 'intent', label: 'Intent', icon: Target, field: 'intent' },
    { key: 'outcome', label: 'Outcome', icon: Layers, field: 'outcome' },
    { key: 'scope', label: 'Scope', icon: FileText, field: 'scope' },
    { key: 'success', label: 'Success Criteria', icon: CheckSquare, field: 'successCriteria' },
    { key: 'constraints', label: 'Constraints', icon: AlertCircle, field: 'constraints' }
  ];

  const getSectionStatus = (sectionKey) => {
    const sectionIndex = sections.findIndex(s => s.key === sectionKey);
    const currentIndex = sections.findIndex(s => s.key === currentSection);

    if (currentSection === 'complete') return 'complete';
    if (sectionIndex < currentIndex) return 'complete';
    if (sectionIndex === currentIndex) return 'active';
    return 'pending';
  };

  const hasContent = (field) => {
    if (field === 'scope') {
      return ticket.scope.included.length > 0 || ticket.scope.excluded.length > 0;
    }
    if (field === 'successCriteria' || field === 'constraints') {
      return ticket[field] && ticket[field].length > 0;
    }
    return ticket[field] && ticket[field].trim() !== '';
  };

  const renderContent = (section) => {
    const { field } = section;

    if (!hasContent(field)) {
      return (
        <p className="text-gray-400 text-sm italic">
          {getSectionStatus(section.key) === 'active'
            ? 'Being discussed...'
            : 'Not yet covered'}
        </p>
      );
    }

    if (field === 'scope') {
      return (
        <div className="space-y-2 text-sm text-gray-700">
          {ticket.scope.included.length > 0 && (
            <div>
              <span className="font-medium text-green-700">In scope: </span>
              {ticket.scope.included.join(', ')}
            </div>
          )}
          {ticket.scope.excluded.length > 0 && (
            <div>
              <span className="font-medium text-red-700">Out of scope: </span>
              {ticket.scope.excluded.join(', ')}
            </div>
          )}
        </div>
      );
    }

    if (field === 'successCriteria') {
      return (
        <ul className="space-y-1">
          {ticket.successCriteria.map((criterion, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5">-</span>
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (field === 'constraints') {
      return (
        <ul className="space-y-1">
          {ticket.constraints.map((constraint, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-amber-600 mt-0.5">!</span>
              <span>{constraint}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket[field]}</p>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconColor = (status) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'active':
        return 'text-indigo-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Ticket Preview</h2>
        <p className="text-sm text-gray-500">
          Your ticket is taking shape as we talk
        </p>
      </div>

      {/* Ticket Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {sections.map((section) => {
            const status = getSectionStatus(section.key);
            const Icon = section.icon;

            return (
              <div
                key={section.key}
                className={`rounded-lg border p-4 transition-all ${getStatusColor(status)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${getIconColor(status)}`} />
                  <h3 className={`font-medium ${
                    status === 'pending' ? 'text-gray-400' : 'text-gray-800'
                  }`}>
                    {section.label}
                  </h3>
                </div>
                {renderContent(section)}
              </div>
            );
          })}
        </div>

        {/* Completion State */}
        {currentSection === 'complete' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Ticket Ready!</h3>
            <p className="text-sm text-green-700">
              Your ticket has all the key information. You can copy this to Jira or continue refining it.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleCopy}
          disabled={!ticket.intent?.trim()}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            copied
              ? 'bg-green-100 text-green-700 border border-green-300'
              : ticket.intent?.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied for Jira
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy to Jira
            </>
          )}
        </button>
      </div>
    </div>
  );
}
