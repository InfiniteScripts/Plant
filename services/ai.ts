import * as SecureStore from 'expo-secure-store';
import { IdentificationResult, DiagnosisResult } from '@/models/DiagnosisResult';
import { getImageBase64 } from './imageUtils';

const API_KEY_STORAGE_KEY = 'anthropic_api_key';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null && key.length > 0;
}

async function callClaude(
  systemPrompt: string,
  userContent: Array<{ type: string; [key: string]: unknown }>,
  maxTokens: number = 1024
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key not configured. Go to Settings to add your Anthropic API key.');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI request failed: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseJsonResponse<T>(text: string): T {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

export async function identifyPlant(photoUri: string): Promise<IdentificationResult> {
  const base64 = await getImageBase64(photoUri);

  const systemPrompt = `You are an expert botanist. Identify the plant in the image and provide care information.
Respond ONLY with valid JSON matching this exact schema:
{
  "species": "Common name",
  "scientificName": "Latin name",
  "wateringIntervalDays": number (how often to water in days),
  "lightPreference": "low" | "medium" | "bright_indirect" | "direct",
  "description": "Brief description of the plant",
  "careNotes": "Key care tips"
}`;

  const response = await callClaude(systemPrompt, [
    {
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
    },
    {
      type: 'text',
      text: 'Identify this plant and provide its care information.',
    },
  ]);

  return parseJsonResponse<IdentificationResult>(response);
}

export async function diagnosePlant(
  photoUri: string,
  species: string
): Promise<Omit<DiagnosisResult, 'plantId' | 'photoUri' | 'timestamp'>> {
  const base64 = await getImageBase64(photoUri);

  const systemPrompt = `You are an expert plant pathologist. Analyze the health of this ${species} plant.
Respond ONLY with valid JSON matching this exact schema:
{
  "overallHealth": "healthy" | "mild_issues" | "needs_attention" | "critical",
  "issues": [
    {
      "name": "Issue name",
      "confidence": 0.0-1.0,
      "description": "What the issue is",
      "treatment": "How to treat it"
    }
  ],
  "careRecommendations": ["recommendation 1", "recommendation 2"]
}
If the plant looks healthy, return an empty issues array and provide general care recommendations.`;

  const response = await callClaude(
    systemPrompt,
    [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
      },
      {
        type: 'text',
        text: `Analyze the health of this ${species} plant. Look for signs of disease, pests, nutrient deficiencies, or other issues.`,
      },
    ],
    2048
  );

  return parseJsonResponse(response);
}
