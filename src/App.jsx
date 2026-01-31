import React, { useState } from 'react';
import { MessageSquare, ClipboardCheck } from 'lucide-react';
import CoachView from './components/coach/CoachView';
import ClassicView from './components/classic/ClassicView';

export default function App() {
  const [activeTab, setActiveTab] = useState('coach');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src="/images/jironaut-logo.png"
            alt="The Jironaut — Charting the stars of Jira"
            className="h-14 w-auto"
          />

          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('coach')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'coach'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Coach
              </button>
              <button
                onClick={() => setActiveTab('classic')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'classic'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Classic
              </button>
            </nav>

            <div className="h-6 w-px bg-gray-200" />

            <a
              href="https://github.com/IanSimon23/jironaut"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://curiouscoach.tools"
              target="_blank"
              rel="noopener noreferrer"
              title="Curious Coach Tools"
            >
              <img
                src="/images/curious_coach_tools_logo.png"
                alt="Curious Coach Tools"
                className="h-10 w-auto"
              />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === 'coach' ? <CoachView /> : <ClassicView />}
      </main>
    </div>
  );
}
