import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Text } from '@/components/Themed';
import {
  getMode,
  setMode,
  getProvider,
  setProvider,
  setApiKey,
  hasApiKey,
  AIMode,
} from '@/services/ai';
import { AIProvider, PROVIDER_LABELS, PROVIDER_KEY_HINTS } from '@/services/aiProviders';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

const PROVIDERS: AIProvider[] = ['anthropic', 'openai', 'google', 'xai'];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [mode, setModeState] = useState<AIMode>('hosted');
  const [provider, setProviderState] = useState<AIProvider>('anthropic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [reminderHour, setReminderHour] = useState('9');
  const [reminderMinute, setReminderMinute] = useState('00');
  const user = useAuthStore((s) => s.user);

  const refreshKeyStatus = useCallback(async (p: AIProvider) => {
    setHasKey(await hasApiKey(p));
  }, []);

  useEffect(() => {
    (async () => {
      setModeState(await getMode());
      const p = await getProvider();
      setProviderState(p);
      await refreshKeyStatus(p);
    })();
  }, [refreshKeyStatus]);

  const handleModeChange = async (next: AIMode) => {
    setModeState(next);
    await setMode(next);
  };

  const handleProviderChange = async (next: AIProvider) => {
    setProviderState(next);
    setApiKeyInput('');
    setShowKey(false);
    await setProvider(next);
    await refreshKeyStatus(next);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    await setApiKey(provider, apiKeyInput.trim());
    setApiKeyInput('');
    setShowKey(false);
    await refreshKeyStatus(provider);
    Alert.alert('Saved', `Your ${PROVIDER_LABELS[provider]} key has been securely stored.`);
  };

  const handleClearApiKey = async () => {
    Alert.alert(
      'Clear API Key',
      `Remove the saved ${PROVIDER_LABELS[provider]} key?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await setApiKey(provider, '');
            await refreshKeyStatus(provider);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>

      {/* AI Configuration */}
      <Text style={styles.sectionTitle}>AI Configuration</Text>
      <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <RNView style={styles.modeRow}>
          <ModeOption
            label="Hosted"
            description="Use Petalwise's AI"
            selected={mode === 'hosted'}
            onPress={() => handleModeChange('hosted')}
            colors={colors}
          />
          <ModeOption
            label="Bring your own"
            description="Use your own API key"
            selected={mode === 'byok'}
            onPress={() => handleModeChange('byok')}
            colors={colors}
          />
        </RNView>

        {mode === 'byok' && (
          <RNView style={styles.byokSection}>
            <Text style={[styles.cardLabel, { color: colors.secondaryText, marginTop: 16 }]}>
              Provider
            </Text>
            <RNView style={styles.providerRow}>
              {PROVIDERS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => handleProviderChange(p)}
                  style={[
                    styles.providerChip,
                    {
                      backgroundColor: provider === p ? colors.tint : colors.background,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.providerChipText,
                      { color: provider === p ? '#fff' : colors.text },
                    ]}>
                    {PROVIDER_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </RNView>

            <Text style={[styles.cardLabel, { color: colors.secondaryText, marginTop: 16 }]}>
              API Key
            </Text>
            {hasKey ? (
              <RNView style={styles.keyStatus}>
                <Text style={[styles.keyStatusText, { color: colors.success }]}>
                  Key configured for {PROVIDER_LABELS[provider]}
                </Text>
                <TouchableOpacity onPress={handleClearApiKey}>
                  <Text style={[styles.clearButton, { color: colors.error }]}>Clear</Text>
                </TouchableOpacity>
              </RNView>
            ) : (
              <RNView>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder={PROVIDER_KEY_HINTS[provider]}
                  placeholderTextColor={colors.secondaryText}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <RNView style={styles.keyActions}>
                  <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                    <Text style={[styles.toggleShow, { color: colors.tint }]}>
                      {showKey ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveKeyButton, { backgroundColor: colors.tint }]}
                    onPress={handleSaveApiKey}>
                    <Text style={styles.saveKeyButtonText}>Save Key</Text>
                  </TouchableOpacity>
                </RNView>
              </RNView>
            )}
          </RNView>
        )}
      </RNView>

      {/* Notification Settings */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.secondaryText }]}>Reminder Time</Text>
        <Text style={[styles.cardDescription, { color: colors.secondaryText }]}>
          Time of day to receive watering reminders
        </Text>
        <RNView style={styles.timeRow}>
          <TextInput
            style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={reminderHour}
            onChangeText={setReminderHour}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TextInput
            style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={reminderMinute}
            onChangeText={setReminderMinute}
            keyboardType="number-pad"
            maxLength={2}
          />
        </RNView>
      </RNView>

      {/* Account */}
      <Text style={styles.sectionTitle}>Account</Text>
      <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.secondaryText }]}>Signed in as</Text>
        <Text style={[styles.accountEmail, { color: colors.text }]}>
          {user?.email ?? user?.displayName ?? 'Anonymous'}
        </Text>
      </RNView>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.aboutTitle}>Petalwise</Text>
        <Text style={[styles.aboutText, { color: colors.secondaryText }]}>
          AI-powered plant care assistant. Take photos of your plants to get personalized watering schedules and health diagnostics.
        </Text>
        <Text style={[styles.version, { color: colors.secondaryText }]}>Version 1.0.0</Text>
      </RNView>
    </ScrollView>
  );
}

interface ModeOptionProps {
  readonly label: string;
  readonly description: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly colors: typeof Colors.light;
}

function ModeOption({ label, description, selected, onPress, colors }: Readonly<ModeOptionProps>) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.modeOption,
        {
          backgroundColor: selected ? colors.tint : colors.background,
          borderColor: colors.border,
        },
      ]}>
      <Text style={[styles.modeLabel, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
      <Text
        style={[
          styles.modeDescription,
          { color: selected ? 'rgba(255,255,255,0.85)' : colors.secondaryText },
        ]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, marginTop: 16 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  cardLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardDescription: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  modeLabel: { fontSize: 14, fontWeight: '700' },
  modeDescription: { fontSize: 12, marginTop: 4 },
  byokSection: { marginTop: 4 },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  providerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  providerChipText: { fontSize: 13, fontWeight: '600' },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    marginTop: 6,
  },
  keyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleShow: { fontSize: 14, fontWeight: '500' },
  saveKeyButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveKeyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  keyStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  keyStatusText: { fontSize: 14, fontWeight: '600', flex: 1 },
  clearButton: { fontSize: 14, fontWeight: '500' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    width: 50,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  timeSeparator: { fontSize: 20, fontWeight: '700' },
  aboutTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  aboutText: { fontSize: 14, lineHeight: 20 },
  version: { fontSize: 12, marginTop: 8 },
  accountEmail: { fontSize: 16, fontWeight: '600' },
});
