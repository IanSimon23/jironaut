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

    const systemPrompt = `Extract Jira ticket fields from a coaching conversation. You receive the FULL conversation each time. Extract EVERYTHING you can find, even if it was mentioned while discussing a different topic.

FIELDS:
- intent: 1-3 sentences. Why this work matters, who is affected.
- outcome: 1-3 sentences. What will be different when done. Impact, not tasks.
- scope: { "included": ["..."], "excluded": ["..."] }. What's in and out.
- successCriteria: ["..."]. How we'll know it worked. Concrete statements.
- constraints: ["..."]. Deadlines, dependencies, technical limits. [] if none.

CRITICAL RULES:
- Extract a field AS SOON as any relevant information appears, even if the conversation hasn't formally reached that section.
- If the user mentions scope while answering about outcome, extract scope.
- If the user's first message contains intent AND hints at outcome, extract both.
- Do not wait for a section to be "discussed" — extract what's there.
- Set a field to null ONLY if there is genuinely zero information about it anywhere in the conversation.

For suggestedSection, pick the next section that still needs more information:
intent → outcome → scope → success → constraints → complete.
Set "complete" when intent + outcome + scope + success all have content.

EXAMPLES:

Conversation (2 exchanges):
User: "We're losing 40% of users at onboarding. They drop off at invite team members."
Coach: "What should onboarding look like when this is fixed?"
User: "Get users to their first project fast. Team invites can wait."

Extract:
{"ticketUpdates":{"intent":"40% of new users drop off during onboarding at the invite team members step.","outcome":"Users complete their first project quickly with less friction. Team invitations deferred to later.","scope":{"included":["Onboarding flow","First project setup"],"excluded":["Team invitation step"]},"successCriteria":null,"constraints":null},"suggestedSection":"success","isComplete":false}

Note: scope was extracted even though the coach only asked about outcome — the user's answer implied it.

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
