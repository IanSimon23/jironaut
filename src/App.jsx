import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Sparkles, Award, AlertTriangle } from 'lucide-react';

export default function JironautAnalyzer() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticketType: 'story',
    workType: []
  });

  const [customDoR, setCustomDoR] = useState(null);
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomDoR, setShowCustomDoR] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const ticketTypes = [
    { value: 'story', label: 'Story' },
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'task', label: 'Task' },
    { value: 'spike', label: 'Spike' },
    { value: 'tech-debt', label: 'Tech Debt' }
  ];

  const workTypes = [
    { value: 'frontend', label: 'Front-end' },
    { value: 'backend', label: 'Back-end' },
    { value: 'fullstack', label: 'Full-stack' },
    { value: 'qa-only', label: 'QA-only' },
    { value: 'devops', label: 'DevOps' },
    { value: 'other', label: 'Other' }
  ];

  const handleWorkTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      workType: prev.workType.includes(type)
        ? prev.workType.filter(t => t !== type)
        : [...prev.workType, type]
    }));
  };

  const handleDoRUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setCustomDoR(content);
      setShowCustomDoR(false);
    };
    reader.readAsText(file);
  };

  const clearCustomDoR = () => {
    setCustomDoR(null);
  };

  const analyzeStory = async () => {
    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const systemPrompt = customDoR
        ? `You are The Jironaut, a ticket quality reviewer for a scrum team. Analyze Jira tickets against this custom Definition of Ready:

${customDoR}

CRITICAL: Return ONLY a valid JSON object with no markdown formatting, no backticks, no preamble, no explanation. Just pure JSON.

Required JSON structure:
{
  "score": <number>,
  "percentage": <number>,
  "totalPossible": 100,
  "badges": [{"name": "string", "emoji": "string", "description": "string"}],
  "baseCriteria": [{"name": "string", "score": <number>, "max": <number>, "status": "pass|warning|fail", "feedback": "string"}],
  "typeCriteria": [{"name": "string", "score": <number>, "max": <number>, "status": "pass|warning|fail", "feedback": "string"}],
  "dorAssessment": {
    "met": ["string"],
    "partial": ["string"],
    "missing": ["string"]
  },
  "feedback": {
    "positive": "string",
    "improvement": "string"
  },
  "piiDetected": false,
  "piiDetails": null
}

Analyze the ticket against the custom DoR provided. Create appropriate scoring criteria based on the DoR content. Be honest and critical in scoring.`
        : `You are The Jironaut, a ticket quality reviewer for a scrum team. Analyze Jira tickets against the Definition of Ready and provide scoring.

CRITICAL: Return ONLY a valid JSON object with no markdown formatting, no backticks, no preamble, no explanation. Just pure JSON.

Required JSON structure:
{
  "score": <number>,
  "percentage": <number>,
  "totalPossible": 100,
  "badges": [{"name": "string", "emoji": "string", "description": "string"}],
  "baseCriteria": [{"name": "string", "score": <number>, "max": <number>, "status": "pass|warning|fail", "feedback": "string"}],
  "typeCriteria": [{"name": "string", "score": <number>, "max": <number>, "status": "pass|warning|fail", "feedback": "string"}],
  "dorAssessment": {
    "met": ["string"],
    "partial": ["string"],
    "missing": ["string"]
  },
  "feedback": {
    "positive": "string",
    "improvement": "string"
  },
  "piiDetected": false,
  "piiDetails": null
}

SCORING RUBRIC:

Base Criteria (70 points total):
- Title clarity (10): Clear, concise, goal-oriented title
- Value articulation (10): Who benefits and why? Business impact clear
- Non-technical accessibility (10): Understandable to non-dev stakeholders
- Acceptance criteria (10): Clear, testable success conditions
- Risk & impact assessment (10): Legal, security, wider implications
- Dependencies (10): Technical/delivery dependencies with links
- Observability & metrics (5): Analytics, monitoring, error tracking
- Release strategy (5): Release type and controls (toggles, AB tests)

Type-Specific Criteria (30 points):

Story: Functional & automated testing (10), UX design implications (10), Accessibility/WCAG (10)
Bug: Impact & reproducibility (10), Reproduction steps (10), Contacts & severity (10)
Feature: Benefit hypothesis (10), Leading indicators (10), Strategic alignment (10)
Task: Scope clarity (15), Expected outcome (15)
Spike: Learning goal (10), Timebox (10), Expected deliverable (10)
Tech Debt: Justification (10), Impact if not addressed (10), Risk assessment (10)

BADGES (award based on criteria scores):
- 🥇 Clarity Champion: Title + Value + Non-tech Accessibility ≥ 25/30
- 🧠 Epic Architect: Total score ≥ 85%
- ⚖️ Risk Wrangler: Risk + Dependencies + Observability ≥ 20/25
- 🚀 Release Navigator: Release + Testing + Metrics ≥ 20/25
- 🎨 UX Hero (Stories): UX + Accessibility ≥ 16/20
- 🔍 Bug Whisperer (Bugs): Impact + Reproduction + Contacts ≥ 25/30
- 🌟 Visionary Thinker (Features): Benefit + Strategic + Indicators ≥ 25/30

PII Detection: Flag any personal information (names, emails, phone numbers, addresses, etc.)

Be honest and critical in scoring. A vague title like "New feature" should score 2-3/10, not 9/10.`;

      const userPrompt = `Analyze this Jira ticket:

Ticket Type: ${formData.ticketType}
Work Type: ${formData.workType.join(', ') || 'Not specified'}

Title: ${formData.title}

Description:
${formData.description}

Return ONLY the JSON object, nothing else.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      const textContent = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const cleanedText = textContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const analysisResults = JSON.parse(cleanedText);

      setResults(analysisResults);

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 85) return 'bg-green-50 border-green-200';
    if (percentage >= 70) return 'bg-blue-50 border-blue-200';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <img
                src="/images/jironaut-logo.png"
                alt="Jironaut Logo"
                className="w-20 h-20"
              />
              <h1 className="text-5xl font-bold text-gray-800">The Jironaut</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setShowAbout(true)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                About
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            Charting the stars of Jira — helping teams create, clarify, and complete with confidence
          </p>
          <p className="text-sm text-gray-500">
            AI-powered ticket quality analysis against your Definition of Ready
          </p>
        </div>

        {/* Custom DoR Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Definition of Ready</h3>
              <p className="text-sm text-gray-600">
                {customDoR ? 'Using custom DoR' : 'Using default DoR'}
              </p>
            </div>
            <button
              onClick={() => setShowCustomDoR(!showCustomDoR)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              {showCustomDoR ? 'Hide' : 'Customize'}
            </button>
          </div>

          {showCustomDoR && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Custom Definition of Ready
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload a text file (.txt, .md) containing your team's DoR. This will override the default scoring rubric.
                </p>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleDoRUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {customDoR && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Custom DoR Loaded</p>
                        <p className="text-xs text-green-700 mt-1">
                          {customDoR.length} characters • Analysis will use your custom criteria
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearCustomDoR}
                      className="text-green-700 hover:text-green-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ticket Details</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Enable guest checkout to reduce cart abandonment"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Paste your full Jira ticket description here..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Type
                </label>
                <select
                  value={formData.ticketType}
                  onChange={(e) => setFormData({...formData, ticketType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                >
                  {ticketTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Type (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {workTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleWorkTypeToggle(type.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.workType.includes(type.value)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={analyzeStory}
              disabled={analyzing || !formData.title || !formData.description}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Analyzing Ticket...
                </span>
              ) : (
                'Analyze Ticket Quality'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-2">Analysis Failed</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {results.piiDetected && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">
                      ⚠️ WARNING: PII DETECTED
                    </h3>
                    <p className="text-red-700 mb-3">
                      Personally Identifiable Information should NEVER be stored in Jira tickets.
                    </p>
                    <div className="bg-white rounded-lg p-4 text-sm text-red-800">
                      {results.piiDetails}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-xl shadow-lg p-8 border-2 ${getScoreBgColor(results.percentage)}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Quality Score</h2>
                  <p className="text-gray-600">Based on your Definition of Ready</p>
                </div>
                <div className="text-right">
                  <div className={`text-6xl font-bold ${getScoreColor(results.percentage)}`}>
                    {results.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {results.score}/{results.totalPossible} points
                  </div>
                </div>
              </div>

              {results.badges && results.badges.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Badges Earned
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {results.badges.map((badge, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg px-4 py-3 shadow-md border border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{badge.emoji}</span>
                          <div>
                            <div className="font-semibold text-gray-800">{badge.name}</div>
                            <div className="text-xs text-gray-600">{badge.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Score Breakdown</h3>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">
                  Base Criteria ({results.baseCriteria.reduce((sum, c) => sum + c.score, 0)}/70 points)
                </h4>
                <div className="space-y-3">
                  {results.baseCriteria.map((criterion, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${getStatusColor(criterion.status)}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getStatusIcon(criterion.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="font-semibold text-gray-800">{criterion.name}</div>
                          <div className="text-sm font-medium text-gray-600 ml-2">
                            {criterion.score}/{criterion.max}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">{criterion.feedback}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {results.typeCriteria && results.typeCriteria.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">
                    {formData.ticketType.charAt(0).toUpperCase() + formData.ticketType.slice(1)}-Specific Criteria ({results.typeCriteria.reduce((sum, c) => sum + c.score, 0)}/30 points)
                  </h4>
                  <div className="space-y-3">
                    {results.typeCriteria.map((criterion, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-4 rounded-lg border ${getStatusColor(criterion.status)}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getStatusIcon(criterion.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <div className="font-semibold text-gray-800">{criterion.name}</div>
                            <div className="text-sm font-medium text-gray-600 ml-2">
                              {criterion.score}/{criterion.max}
                            </div>
                          </div>
                          <div className="text-sm text-gray-700">{criterion.feedback}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Definition of Ready Assessment</h3>

              <div className="space-y-6">
                {results.dorAssessment.met && results.dorAssessment.met.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Clearly Met
                    </h4>
                    <ul className="space-y-2">
                      {results.dorAssessment.met.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.dorAssessment.partial && results.dorAssessment.partial.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Partially Met
                    </h4>
                    <ul className="space-y-2">
                      {results.dorAssessment.partial.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-yellow-600 font-bold mt-0.5">⚠</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.dorAssessment.missing && results.dorAssessment.missing.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Missing
                    </h4>
                    <ul className="space-y-2">
                      {results.dorAssessment.missing.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-red-600 font-bold mt-0.5">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  🌟 One Thing Done Well
                </h3>
                <p className="text-gray-700">{results.feedback.positive}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  🎯 One Priority Improvement
                </h3>
                <p className="text-gray-700">{results.feedback.improvement}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-semibold mb-3">Need Help Improving Your Ticket?</h3>
              <p className="text-indigo-100">
                Based on this analysis, you can now refine your ticket to address the gaps identified. Focus on the priority improvement suggested above, then re-analyze to see your score improve!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={() => setShowAbout(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src="/images/jironaut-logo.png" alt="Jironaut" className="w-16 h-16" />
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">The Jironaut</h2>
                    <p className="text-gray-600">v1.0</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">What is The Jironaut?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Jironaut is an AI-powered tool that helps scrum teams improve the quality, consistency,
                    and clarity of their Jira tickets. It analyzes tickets against your Definition of Ready and
                    industry best practices, providing actionable feedback to help teams write better stories,
                    bugs, features, and more.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">How It Works</h3>
                  <ol className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">1.</span>
                      <span>Paste your Jira ticket title and description</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">2.</span>
                      <span>Select the ticket type and work areas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">3.</span>
                      <span>Click Analyze to get detailed scoring and feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">4.</span>
                      <span>Use the recommendations to improve your ticket before it enters the backlog</span>
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Features</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Scores against Definition of Ready</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Supports 6 ticket types</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Custom DoR upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">PII detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Actionable feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Badge system for excellence</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Supported Ticket Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Story', 'Bug', 'Feature', 'Task', 'Spike', 'Tech Debt'].map(type => (
                      <div key={type} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium text-center">
                        {type}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Pro Tip</h3>
                  <p className="text-blue-700 text-sm">
                    Upload your team's custom Definition of Ready to get scoring tailored to your specific
                    standards and practices. The Jironaut will adapt its analysis to your criteria.
                  </p>
                </section>

                <section className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    Built with ❤️ to help teams write better tickets
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Powered by Claude AI • Open source
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
