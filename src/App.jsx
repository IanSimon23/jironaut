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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/jironaut-logo.png"
                alt="Jironaut Logo"
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">The Jironaut</h1>
                <p className="text-sm text-gray-500">Charting the stars of Jira</p>
              </div>
            </div>

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
