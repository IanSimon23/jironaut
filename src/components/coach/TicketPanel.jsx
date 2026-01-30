import React from 'react';
import { FileText, Target, Layers, CheckSquare, AlertCircle } from 'lucide-react';

export default function TicketPanel({ ticket, currentSection }) {
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

      {/* Footer with format options (placeholder for Phase 2) */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400 text-center">
          Format options coming soon
        </p>
      </div>
    </div>
  );
}
