# The Jironaut 🚀

![Jironaut Logo](public/images/jironaut-logo.png)

**Charting the stars of Jira — helping teams create, clarify, and complete with confidence**

An AI-powered tool that analyzes Jira tickets against your Definition of Ready, helping scrum teams write better stories, bugs, features, and more.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://jironaut.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 What is The Jironaut?

The Jironaut is an AI-powered quality reviewer for Jira tickets. It evaluates your work items against industry best practices and your team's Definition of Ready, providing:

- **Scored feedback** across multiple criteria (title clarity, acceptance criteria, risk assessment, etc.)
- **Actionable recommendations** to improve ticket quality before they enter your backlog
- **PII detection** to prevent sensitive information from being stored in Jira
- **Custom DoR support** - upload your team's specific Definition of Ready
- **Badge system** to celebrate well-crafted tickets

### Supported Ticket Types
- 📖 **Stories** - User stories with UX and accessibility checks
- 🐛 **Bugs** - Bug reports with reproduction steps and impact analysis
- ✨ **Features** - Feature proposals with benefit hypothesis and strategic alignment
- ✅ **Tasks** - Technical tasks with scope and outcome clarity
- 🔬 **Spikes** - Investigation tickets with learning goals and timeboxes
- 🛠️ **Tech Debt** - Technical debt with justification and impact assessment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/jironaut.git
cd jironaut

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API key to .env.local
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see The Jironaut in action!

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/jironaut)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add your API key as an environment variable when prompted
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod

# Set environment variable in Netlify dashboard
# ANTHROPIC_API_KEY=your-key-here
```

---

## 🎨 Features

### Core Functionality
- ✅ Analyzes 6 different ticket types with type-specific criteria
- ✅ Scores against base criteria (title, value, acceptance criteria, dependencies, etc.)
- ✅ Provides detailed feedback for each criterion
- ✅ Maps results to Definition of Ready checklist
- ✅ Detects and warns about PII in tickets
- ✅ Awards badges for excellence (Clarity Champion 🥇, UX Hero 🎨, etc.)

### Customization
- ✅ Upload custom Definition of Ready (supports .txt and .md files)
- ✅ Configurable work types (front-end, back-end, full-stack, etc.)
- ✅ Adapts scoring based on ticket type and work type

### User Experience
- ✅ Clean, modern interface with Tailwind CSS
- ✅ Real-time analysis with loading states
- ✅ Color-coded scoring (green ≥85%, blue ≥70%, yellow ≥50%, red <50%)
- ✅ Responsive design for mobile and desktop
- ✅ About modal with usage instructions

---

## 🧠 How It Works

The Jironaut uses Claude AI (Anthropic) to analyze your tickets. Here's the flow:

1. **Input**: User pastes ticket title, description, and selects ticket/work type
2. **Analysis**: Frontend calls serverless API function (`/api/analyze`)
3. **AI Processing**: Serverless function securely calls Claude API with structured prompt
4. **Scoring**: Claude evaluates against Definition of Ready criteria
5. **Results**: Frontend displays scores, feedback, and recommendations

### Scoring Rubric

**Base Criteria (70 points):**
- Title clarity (10 pts)
- Value articulation (10 pts)
- Non-technical accessibility (10 pts)
- Acceptance criteria (10 pts)
- Risk & impact assessment (10 pts)
- Dependencies (10 pts)
- Observability & metrics (5 pts)
- Release strategy (5 pts)

**Type-Specific Criteria (30 points):**
- Varies by ticket type (Story, Bug, Feature, Task, Spike, Tech Debt)

**Total: 100 points**

---

## 🔐 Security & Privacy

- **API Key Protection**: Your Anthropic API key is stored securely in environment variables and never exposed to the client
- **Serverless Architecture**: API calls are proxied through Vercel/Netlify serverless functions
- **PII Detection**: Built-in detection warns users if personally identifiable information is found in tickets
- **No Data Storage**: The Jironaut doesn't store or log your ticket data

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Icons**: Lucide React
- **AI**: Claude Sonnet 4 (Anthropic API)
- **Backend**: Vercel Serverless Functions
- **Hosting**: Vercel / Netlify

---

## 📁 Project Structure

```
jironaut/
├── api/
│   └── analyze.js          # Serverless API function for Claude
├── src/
│   ├── App.jsx            # Main React component
│   ├── main.jsx           # React entry point
│   └── index.css          # Tailwind imports
├── public/
│   └── images/
│       └── jironaut-logo.png
├── index.html             # HTML template
├── vercel.json            # Vercel configuration
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── package.json           # Dependencies
├── .env.local             # Environment variables (not committed)
└── README.md
```

---

## 🎓 Usage Tips

### For Best Results:
1. **Be specific in titles** - "Enable guest checkout to reduce cart abandonment" scores better than "Fix checkout"
2. **Include acceptance criteria** - Clear, testable conditions improve scores significantly
3. **Identify dependencies** - Link to related tickets and external dependencies
4. **Consider accessibility** - For front-end work, mention WCAG compliance
5. **Upload your DoR** - Get scoring tailored to your team's standards

### Custom Definition of Ready:
Click "Customize" → Upload your team's DoR as a .txt or .md file. The Jironaut will adapt its analysis to your specific criteria.

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions:
- Add support for more AI providers (OpenAI, Azure, etc.)
- Implement rate limiting
- Add analytics/usage tracking
- Create Chrome extension for direct Jira integration
- Add example tickets for testing
- Improve scoring rubric
- Add internationalization

---

## 📊 Roadmap

- [ ] Rate limiting (per IP or authenticated user)
- [ ] Usage analytics dashboard
- [ ] Jira browser extension
- [ ] Team collaboration features
- [ ] Historical scoring trends
- [ ] Multiple AI provider support
- [ ] Ticket improvement suggestions (AI-powered rewrites)
- [ ] Bulk ticket analysis

---

## 💰 Cost Considerations

The Jironaut uses the Anthropic API, which charges per token:
- **~$0.03 per analysis** (approximate)
- **$5 credit = ~150 analyses**
- **$20 credit = ~600 analyses**

For teams, budget ~$10-20/month for moderate usage.

### Cost Optimization:
- Results are not cached (each analysis is fresh)
- Consider implementing rate limiting for public deployments
- Monitor usage in Anthropic console

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Claude AI** by Anthropic - Powers the intelligent analysis
- **Lucide** - Beautiful icons
- **Tailwind CSS** - Styling framework
- **Vite** - Lightning-fast build tool
- **The Agile Community** - For Definition of Ready best practices

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/jironaut/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/jironaut/discussions)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)

---

## ⭐ Show Your Support

If The Jironaut helps your team write better tickets, please:
- Give it a ⭐ on GitHub
- Share it with your team
- Contribute improvements
- Provide feedback

---

**Built with ❤️ to help teams write better tickets**

*Charting the stars of Jira, one ticket at a time* 🚀✨
