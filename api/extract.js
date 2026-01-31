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

    const systemPrompt = `Extract Jira ticket fields from a coaching conversation. You receive the FULL conversation each time. Populate as many fields as possible, as early as possible. A rough extraction now is better than a perfect one later — you get the full conversation again next turn to refine.

FIELDS:
- intent: 1-3 sentences. Why this work matters, who is affected.
- outcome: 1-3 sentences. What will be different when done. Impact, not tasks.
- scope: { "included": ["..."], "excluded": ["..."] }. What's in and out.
- successCriteria: ["..."]. How we'll know it worked. Concrete statements.
- constraints: ["..."]. Deadlines, dependencies, technical limits. [] if none mentioned.

RULES:
- Extract from hints and implications, not just explicit statements.
- If the problem implies a solution, extract outcome. If the user names specific areas, extract scope.
- Infer successCriteria from any numbers, metrics, or concrete descriptions of "done."
- null means genuinely ZERO signal anywhere in the conversation — not even a hint.

suggestedSection: next section that needs MORE information.
intent → outcome → scope → success → constraints → complete.
"complete" when intent + outcome + scope + success all have content.

EXAMPLE 1 — After 1 user message:

User: "Customers want push notifications on mobile. They only get email alerts and they're missing time-sensitive approvals."

{"ticketUpdates":{"intent":"Customers only receive email alerts and are missing time-sensitive approvals that need quick action.","outcome":"Users receive push notifications on mobile for time-sensitive items so approvals aren't missed.","scope":{"included":["Mobile push notifications","Time-sensitive approval alerts"],"excluded":[]},"successCriteria":null,"constraints":null},"suggestedSection":"success","isComplete":false}

Intent is explicit. Outcome is implied — push notifications solve missed approvals. Scope is implied — mobile push for approvals. 3 fields from 1 message.

EXAMPLE 2 — After 3 exchanges:

User: "Dashboard search takes 8+ seconds. Enterprise users complain weekly."
Coach: "When this is fixed, what should search feel like?"
User: "1-2 second response times. Should also reduce error logs and support tickets."
Coach: "What's in scope for this pass?"
User: "Give the devs free rein."

{"ticketUpdates":{"intent":"Dashboard search takes 8+ seconds, causing weekly complaints from enterprise users.","outcome":"Search returns results in 1-2 seconds. Error logs and support ticket volume decrease.","scope":{"included":["All dashboard search infrastructure"],"excluded":[]},"successCriteria":["Search response time under 2 seconds","Reduction in search-related error logs","Fewer support tickets about search performance"],"constraints":null},"suggestedSection":"constraints","isComplete":false}

successCriteria inferred from the outcome answer — "1-2 seconds", "reduce error logs", "reduce support tickets" are concrete enough to extract as criteria immediately.

Respond with ONLY a JSON object. No markdown, no backticks.
{"ticketUpdates":{"intent":"...or null","outcome":"...or null","scope":"...or null","successCriteria":"...or null","constraints":"...or null"},"suggestedSection":"...","isComplete":false}`;

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
