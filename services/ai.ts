import * as SecureStore from 'expo-secure-store';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { IdentificationResult, DiagnosisResult } from '@/models/DiagnosisResult';
import { getImageBase64 } from './imageUtils';
import {
  AIProvider,
  identifyWithProvider,
  diagnoseWithProvider,
} from './aiProviders';

const PROVIDER_PREF_KEY = 'ai_provider_preference';
const HOSTED_MODE_KEY = 'ai_hosted_mode';
const LEGACY_KEY = 'anthropic_api_key';

function providerKeyName(provider: AIProvider) {
  return `ai_key_${provider}`;
}

export type AIMode = 'hosted' | 'byok';

export async function getMode(): Promise<AIMode> {
  const v = await SecureStore.getItemAsync(HOSTED_MODE_KEY);
  return v === 'byok' ? 'byok' : 'hosted';
}

export async function setMode(mode: AIMode): Promise<void> {
  await SecureStore.setItemAsync(HOSTED_MODE_KEY, mode);
}

export async function getProvider(): Promise<AIProvider> {
  const v = (await SecureStore.getItemAsync(PROVIDER_PREF_KEY)) as AIProvider | null;
  return v ?? 'anthropic';
}

export async function setProvider(provider: AIProvider): Promise<void> {
  await SecureStore.setItemAsync(PROVIDER_PREF_KEY, provider);
}

export async function getApiKey(provider: AIProvider): Promise<string | null> {
  return SecureStore.getItemAsync(providerKeyName(provider));
}

export async function setApiKey(provider: AIProvider, key: string): Promise<void> {
  if (!key) {
    await SecureStore.deleteItemAsync(providerKeyName(provider));
    return;
  }
  await SecureStore.setItemAsync(providerKeyName(provider), key);
}

export async function hasApiKey(provider: AIProvider): Promise<boolean> {
  const key = await getApiKey(provider);
  return !!key;
}

// Migrate the legacy single-key storage into the new per-provider slot.
export async function migrateLegacyKey(): Promise<void> {
  const legacy = await SecureStore.getItemAsync(LEGACY_KEY);
  if (!legacy) return;
  const existing = await SecureStore.getItemAsync(providerKeyName('anthropic'));
  if (!existing) {
    await SecureStore.setItemAsync(providerKeyName('anthropic'), legacy);
  }
  await SecureStore.deleteItemAsync(LEGACY_KEY);
}

async function callHosted<T>(name: 'identifyPlant' | 'diagnosePlant', payload: unknown): Promise<T> {
  const fn = httpsCallable<unknown, T>(getFunctions(), name);
  const result = await fn(payload);
  return result.data;
}

export async function identifyPlant(photoUri: string): Promise<IdentificationResult> {
  const base64 = await getImageBase64(photoUri);
  const mode = await getMode();

  if (mode === 'hosted') {
    return callHosted<IdentificationResult>('identifyPlant', { imageBase64: base64 });
  }

  const provider = await getProvider();
  const key = await getApiKey(provider);
  if (!key) {
    throw new Error(`No API key set for ${provider}. Add one in Settings.`);
  }
  return identifyWithProvider(provider, key, base64);
}

export async function diagnosePlant(
  photoUri: string,
  species: string
): Promise<Omit<DiagnosisResult, 'plantId' | 'photoUri' | 'timestamp'>> {
  const base64 = await getImageBase64(photoUri);
  const mode = await getMode();

  if (mode === 'hosted') {
    return callHosted('diagnosePlant', { imageBase64: base64, species });
  }

  const provider = await getProvider();
  const key = await getApiKey(provider);
  if (!key) {
    throw new Error(`No API key set for ${provider}. Add one in Settings.`);
  }
  return diagnoseWithProvider(provider, key, base64, species);
}
