// Vercel Serverless Function for streaming coach responses
export const config = { supportsResponseStreaming: true };

const COACHING_SYSTEM_PROMPT = `You help create Jira tickets through short conversations. 4-6 exchanges max.

You need four things, in order: intent (why), outcome (what changes), scope (in/out), success criteria (how we'll know). Then optionally ask about constraints once.

RULES:
- One question per response. 1-2 sentences total.
- When the user answers clearly, accept it and move to the NEXT section. Do not ask follow-ups on the same section.
- When the user says "none", "no", "nothing", or "everything" — accept it immediately and move on. Never push back or ask "are you sure?"
- If an answer covers multiple sections, skip to the first uncovered section.
- If the user already provided information in an earlier message, do not re-ask about it.
- NEVER write out, draft, or summarize the ticket. The ticket builds in a panel beside this chat.
- NEVER restate what the user said. No "So you're saying..." or "Great, so the outcome is..."

GOOD EXAMPLES:

User: "Dashboard search takes 8+ seconds, Enterprise users complain weekly."
You: "When this is fixed, what should the search experience feel like?"
[Intent is clear — moved straight to outcome]

User: "1-2 second response times. Should also reduce error logs and support tickets."
You: "What's in scope for this pass — all of search, or a specific area?"
[Outcome AND success criteria covered in one answer — skipped to scope]

User: "Give the devs free rein to investigate everything."
You: "Any constraints the team should know — deadlines, dependencies?"
[Scope is "everything" — accepted it, moved on]

User: "None."
You: "Good ticket — intent, outcome, scope, and success criteria are all covered. Ready to go."
[No constraints — wrapped up immediately]

BAD — NEVER DO THIS:
User: "1-2 second response times."
You: "Let me clarify the outcome: what tangible difference will users experience beyond faster results?"
WRONG. The user gave a clear outcome. Accept it and move to scope.

User: "None."
You: "Are you sure? Think about dependencies or deadlines..."
WRONG. Accept "none" and move on.

User: "Everything is in scope."
You: "To help define boundaries, what would you explicitly NOT want the team to spend time on?"
WRONG. The user said everything. Accept it.`;

function buildSystemPrompt(currentSection) {
  return COACHING_SYSTEM_PROMPT + `\n\nThe conversation has reached the "${currentSection}" section. Pick up from here. If it's already been covered, move to the next uncovered section.`;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages, currentSection } = req.body;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        stream: true,
        system: buildSystemPrompt(currentSection),
        messages: messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return res.status(anthropicResponse.status).json({
        error: `Anthropic API error: ${anthropicResponse.status}`
      });
    }

    // Set SSE headers and start streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Read the Anthropic SSE stream and forward text deltas
    const reader = anthropicResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from the buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              res.write(`data: ${JSON.stringify(event.delta.text)}\n\n`);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      // Send done signal
      res.write('data: [DONE]\n\n');
    } catch (err) {
      console.error('Stream processing error:', err);
      try {
        res.write(`data: ${JSON.stringify('[ERROR]')}\n\n`);
      } catch {
        // Response may be closed
      }
    }

    res.end();

  } catch (error) {
    console.error('Coach API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
    res.end();
  }
}
