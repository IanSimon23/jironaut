// Vercel Serverless Function for ticket data extraction
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

    const systemPrompt = `You are a structured data extractor for Jira ticket coaching conversations. On every call you receive the FULL conversation so far. Extract cumulatively — return the complete picture each time, not just what's new.

CURRENT SECTION: ${currentSection}
SECTIONS IN ORDER: intent → outcome → scope → success → constraints → complete

FIELD DEFINITIONS:
- intent: 1-3 sentences. Why this work matters. The problem being solved or opportunity pursued, and who is affected. Synthesize from what the user said — don't copy verbatim.
- outcome: 1-3 sentences. What will be different when the work is done. Focus on impact and change, not implementation steps.
- scope: Two arrays. "included" = what's in scope (systems, features, surfaces). "excluded" = what's explicitly out of scope or deferred. Use short phrases.
- successCriteria: 3-5 clear statements. How we'll know it worked. Concrete and verifiable.
- constraints: Dependencies, deadlines, compliance needs, technical constraints. Only if mentioned. Empty array [] if none discussed.

SECTION ADVANCEMENT:
- Advance when the user has given a clear answer for the current section (even if brief).
- If the coach has already moved on to asking about the next section, advance to match.
- "constraints" is optional — if the user says "nothing" or the coach wraps up, advance to "complete".
- Set "complete" when intent + outcome + scope + success all have content.

EXAMPLE:
User: "Our dashboard search takes 8+ seconds and users are complaining."
Coach: "That's impacting users directly. When this is fixed, what should the experience feel like?"
User: "Sub-second results. Also the filters should actually work — right now half of them are broken."
Coach: "Clear outcome. What's in scope for this pass — all filters, or a specific subset?"

Extract:
{"ticketUpdates":{"intent":"Dashboard search is unacceptably slow (8+ seconds) and users are actively complaining. Broken filters compound the poor experience.","outcome":"Search returns results in under one second. Dashboard filters work correctly.","scope":null,"successCriteria":null,"constraints":null},"suggestedSection":"scope","isComplete":false}

Respond with ONLY a JSON object. No markdown, no backticks, no explanation.
{
  "ticketUpdates": {
    "intent": "string or null",
    "outcome": "string or null",
    "scope": { "included": ["..."], "excluded": ["..."] } or null,
    "successCriteria": ["..."] or null,
    "constraints": ["..."] or null
  },
  "suggestedSection": "intent|outcome|scope|success|constraints|complete",
  "isComplete": false
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        temperature: 0,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({
        error: `Anthropic API error: ${response.status}`
      });
    }

    const data = await response.json();

    const textContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const cleanedText = textContent
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse extraction response:', cleanedText);
      parsedResponse = {
        ticketUpdates: null,
        suggestedSection: currentSection,
        isComplete: false
      };
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Extract API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
