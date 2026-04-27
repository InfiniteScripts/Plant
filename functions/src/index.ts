import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const MODEL = 'claude-sonnet-4-5';

interface IdentifyPayload {
  imageBase64: string;
}

interface DiagnosePayload {
  imageBase64: string;
  species: string;
}

const FENCED_JSON = /```(?:json)?\s*([\s\S]*?)```/;

function parseJson<T>(text: string): T {
  const match = FENCED_JSON.exec(text);
  return JSON.parse((match ? match[1] : text).trim());
}

function ensureAuth(authContext: { uid?: string } | null | undefined) {
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
}

function ensureBase64(input: unknown): string {
  if (typeof input !== 'string' || input.length < 100) {
    throw new HttpsError('invalid-argument', 'imageBase64 is missing or too small.');
  }
  return input;
}

export const identifyPlant = onCall(
  { secrets: [anthropicKey], region: 'us-central1', timeoutSeconds: 60, memory: '512MiB' },
  async (request) => {
    ensureAuth(request.auth);
    const { imageBase64 } = (request.data ?? {}) as IdentifyPayload;
    const base64 = ensureBase64(imageBase64);

    const client = new Anthropic({ apiKey: anthropicKey.value() });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an expert botanist and plant pathologist. Identify the plant in the image, provide care information, and assess its current health.
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
If the plant looks healthy, return an empty initialIssues array but still provide the summary.`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            {
              type: 'text',
              text: 'Identify this plant, provide care information, and assess its current health from the photo.',
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return parseJson(text);
  }
);

export const diagnosePlant = onCall(
  { secrets: [anthropicKey], region: 'us-central1', timeoutSeconds: 60, memory: '512MiB' },
  async (request) => {
    ensureAuth(request.auth);
    const { imageBase64, species } = (request.data ?? {}) as DiagnosePayload;
    const base64 = ensureBase64(imageBase64);
    if (!species || typeof species !== 'string') {
      throw new HttpsError('invalid-argument', 'species is required.');
    }

    const client = new Anthropic({ apiKey: anthropicKey.value() });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an expert plant pathologist. Analyze the health of this ${species} plant.
Respond ONLY with valid JSON matching this exact schema:
{
  "overallHealth": "healthy" | "mild_issues" | "needs_attention" | "critical",
  "issues": [
    { "name": "Issue name", "confidence": 0.0-1.0, "description": "What the issue is", "treatment": "How to treat it" }
  ],
  "careRecommendations": ["recommendation 1", "recommendation 2"]
}
If the plant looks healthy, return an empty issues array and provide general care recommendations.`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            {
              type: 'text',
              text: `Analyze the health of this ${species} plant. Look for signs of disease, pests, nutrient deficiencies, or other issues.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return parseJson(text);
  }
);
