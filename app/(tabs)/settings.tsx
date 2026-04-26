import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Text } from '@/components/Themed';
import { setApiKey, getApiKey, hasApiKey } from '@/services/ai';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [reminderHour, setReminderHour] = useState('9');
  const [reminderMinute, setReminderMinute] = useState('00');
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  useEffect(() => {
    hasApiKey().then(setHasKey);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    await setApiKey(apiKeyInput.trim());
    setHasKey(true);
    setApiKeyInput('');
    setShowKey(false);
    Alert.alert('Saved', 'Your API key has been securely stored.');
  };

  const handleClearApiKey = async () => {
    Alert.alert('Clear API Key', 'Are you sure? AI features will stop working.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await setApiKey('');
          setHasKey(false);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>

      {/* AI Configuration */}
      <Text style={styles.sectionTitle}>AI Configuration</Text>
      <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.secondaryText }]}>Anthropic API Key</Text>
        <Text style={[styles.cardDescription, { color: colors.secondaryText }]}>
          Required for plant identification and health diagnosis. Get your key at console.anthropic.com
        </Text>

        {hasKey ? (
          <RNView style={styles.keyStatus}>
            <Text style={[styles.keyStatusText, { color: colors.success }]}>API key configured</Text>
            <TouchableOpacity onPress={handleClearApiKey}>
              <Text style={[styles.clearButton, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
          </RNView>
        ) : (
          <RNView>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="sk-ant-..."
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
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutRow}>
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
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
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'SpaceMono',
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
  },
  keyStatusText: { fontSize: 14, fontWeight: '600' },
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
  accountEmail: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  signOutRow: { paddingVertical: 4 },
  signOutText: { fontSize: 14, fontWeight: '600' },
});
