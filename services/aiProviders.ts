import { IdentificationResult, DiagnosisResult } from '@/models/DiagnosisResult';

export type AIProvider = 'anthropic' | 'openai' | 'google' | 'xai';

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
  xai: 'xAI (Grok)',
};

export const PROVIDER_KEY_HINTS: Record<AIProvider, string> = {
  anthropic: 'sk-ant-...',
  openai: 'sk-...',
  google: 'AIza...',
  xai: 'xai-...',
};

const IDENTIFY_SYSTEM = `You are an expert botanist and plant pathologist. Identify the plant in the image, provide care information, and assess its current health.
Respond ONLY with valid JSON matching this exact schema:
{
  "species": "Common name",
  "scientificName": "Latin name",
  "wateringIntervalDays": number,
  "wateringInstructions": "How to water this specific plant (amount, technique, drainage). 1-2 sentences.",
  "lightPreference": "low" | "medium" | "bright_indirect" | "direct",
  "description": "Brief description of the plant",
  "careNotes": "Key care tips",
  "initialHealth": "healthy" | "mild_issues" | "needs_attention" | "critical",
  "initialIssues": [
    { "name": "Issue name (e.g. 'Overwatered', 'Needs more sun', 'Spider mites')", "confidence": 0.0-1.0, "description": "What the issue is", "treatment": "How to address it" }
  ],
  "initialHealthSummary": "One-sentence plain-language summary of the plant's current condition (e.g. 'Looks healthy and well-watered.' or 'Lower leaves are yellowing — likely overwatered.')"
}
If the plant looks healthy, return an empty initialIssues array but still provide the summary.`;

function diagnoseSystem(species: string) {
  return `You are an expert plant pathologist. Analyze the health of this ${species} plant.
Respond ONLY with valid JSON matching this exact schema:
{
  "overallHealth": "healthy" | "mild_issues" | "needs_attention" | "critical",
  "issues": [
    { "name": "Issue name", "confidence": 0.0-1.0, "description": "What the issue is", "treatment": "How to treat it" }
  ],
  "careRecommendations": ["recommendation 1", "recommendation 2"]
}
If the plant looks healthy, return an empty issues array and provide general care recommendations.`;
}

const IDENTIFY_USER = 'Identify this plant and provide its care information.';
const diagnoseUser = (species: string) =>
  `Analyze the health of this ${species} plant. Look for signs of disease, pests, nutrient deficiencies, or other issues.`;

const FENCED_JSON = /```(?:json)?\s*([\s\S]*?)```/;

function parseJson<T>(text: string): T {
  const match = FENCED_JSON.exec(text);
  return JSON.parse((match ? match[1] : text).trim());
}

interface CallArgs {
  apiKey: string;
  base64: string;
  systemPrompt: string;
  userText: string;
  maxTokens: number;
}

async function callAnthropic({ apiKey, base64, systemPrompt, userText, maxTokens }: CallArgs) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: userText },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text as string;
}

async function callOpenAI({ apiKey, base64, systemPrompt, userText, maxTokens }: CallArgs) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callGoogle({ apiKey, base64, systemPrompt, userText, maxTokens }: CallArgs) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
              { text: userText },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

async function callXAI({ apiKey, base64, systemPrompt, userText, maxTokens }: CallArgs) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-vision-latest',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: userText },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`xAI: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

const DISPATCH: Record<AIProvider, (args: CallArgs) => Promise<string>> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  google: callGoogle,
  xai: callXAI,
};

export async function identifyWithProvider(
  provider: AIProvider,
  apiKey: string,
  base64: string
): Promise<IdentificationResult> {
  const text = await DISPATCH[provider]({
    apiKey,
    base64,
    systemPrompt: IDENTIFY_SYSTEM,
    userText: IDENTIFY_USER,
    maxTokens: 2048,
  });
  return parseJson<IdentificationResult>(text);
}

export async function diagnoseWithProvider(
  provider: AIProvider,
  apiKey: string,
  base64: string,
  species: string
): Promise<Omit<DiagnosisResult, 'plantId' | 'photoUri' | 'timestamp'>> {
  const text = await DISPATCH[provider]({
    apiKey,
    base64,
    systemPrompt: diagnoseSystem(species),
    userText: diagnoseUser(species),
    maxTokens: 2048,
  });
  return parseJson(text);
}
