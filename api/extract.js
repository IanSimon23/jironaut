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

    const systemPrompt = `You are a structured data extractor. Given a coaching conversation about creating a Jira ticket, extract ticket information cumulatively from the ENTIRE conversation.

CURRENT SECTION: ${currentSection}

SECTIONS IN ORDER: intent, outcome, scope, success, constraints, complete

RULES:
- Extract information from ALL messages in the conversation, not just the latest
- Synthesize and refine — don't copy verbatim
- Only include fields where you have meaningful information
- Set fields to null if no information has been provided yet
- For suggestedSection: stay on current section if more clarity is needed, advance to the next section when the current one is sufficiently clear, set to "complete" when all sections have enough information
- isComplete should be true only when all non-optional sections have clear information

Respond with ONLY a JSON object (no markdown, no backticks):
{
  "ticketUpdates": {
    "intent": "extracted intent text or null",
    "outcome": "extracted outcome text or null",
    "scope": { "included": ["items"], "excluded": ["items"] } or null,
    "successCriteria": ["criterion 1", "criterion 2"] or null,
    "constraints": ["constraint 1"] or null
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
        max_tokens: 256,
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
