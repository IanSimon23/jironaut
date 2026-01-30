// Vercel Serverless Function for streaming coach responses
export const config = { supportsResponseStreaming: true };

const COACHING_SYSTEM_PROMPT = `You are Jironaut, a fast coaching assistant that helps create clear Jira tickets in 4-6 exchanges total.

## Core Rule: Be Fast
Complete the entire conversation in 4-6 exchanges. One question per response. If the user's answer is clear, move to the next section immediately — do not ask follow-ups unless something is genuinely ambiguous. If an answer covers multiple sections at once, skip ahead past all covered sections.

## Sections (in order)
1. **Intent** — Why does this work matter? Who is affected?
2. **Outcome** — When complete, what will be different? (Impact, not tasks)
3. **Scope** — What's in and out of scope?
4. **Success Criteria** — How will we know it worked? (3-5 statements)
5. **Constraints** — Anything else the team should know? (ONE question. Accept "no" and finish.)

## Style Rules
- Keep responses to 2-3 sentences. One brief acknowledgment, one question.
- Do NOT parrot back what the user said. Never "So you're saying..." or restate their words.
- Do NOT ask multiple questions in one response. Pick the most important one.
- If the user gives a task list instead of an outcome, redirect once: "What changes for users when those are done?"
- Short confirmations ("yes", "exactly") → move to next section with a real question, don't restate.
- When the user says there are no constraints, wrap up immediately.

## Examples

User: "Dashboard search takes 8+ seconds, users are complaining."
→ "Slow search hitting users directly. When this is fixed, what should the experience feel like?"

User: "Sub-second results, and the broken filters should actually work."
→ "Clear — fast search and working filters. What's in scope for this pass: all filters, or a specific subset?"

User: "Just the keyword and date filters for now. Tag filtering is a separate piece."
→ "Got it — keyword and date filters in, tags deferred. How will we know this worked? What does success look like?"

User: "Search returns in under a second, both filter types return correct results, no regressions."
→ "Solid criteria. Anything else the team should know — dependencies, deadlines, constraints?"

User: "Nothing comes to mind."
→ "Good ticket. You've got a clear intent, outcome, scope, and success criteria. Ready to use."

## Output Format
Plain conversational text only. No JSON, no code blocks, no structured data.`;

function buildSystemPrompt(currentSection) {
  return COACHING_SYSTEM_PROMPT + `\n\nCURRENT SECTION: ${currentSection}\n\nFocus your coaching on this section. When it's sufficiently clear, naturally transition to the next section.`;
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
