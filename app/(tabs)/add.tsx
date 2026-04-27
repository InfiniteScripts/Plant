import React, { useState } from 'react';
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  View as RNView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Themed';
import { useCamera } from '@/hooks/useCamera';
import { usePlantStore } from '@/stores/plantStore';
import { useRooms } from '@/hooks/useRooms';
import { identifyPlant, getMode, getProvider, hasApiKey } from '@/services/ai';
import { PROVIDER_LABELS } from '@/services/aiProviders';
import { IdentificationResult } from '@/models/DiagnosisResult';
import { RoomPicker } from '@/components/RoomPicker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type Step = 'capture' | 'identifying' | 'confirm';

export default function AddPlantScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { photo, takePhoto, pickFromLibrary, clearPhoto } = useCamera();
  const addPlant = usePlantStore((s) => s.addPlant);
  const { rooms } = useRooms();

  const [step, setStep] = useState<Step>('capture');
  const [identification, setIdentification] = useState<IdentificationResult | null>(null);
  const [plantName, setPlantName] = useState('');
  const [saving, setSaving] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === roomId);

  const ensureAIReady = async (): Promise<boolean> => {
    const mode = await getMode();
    if (mode === 'hosted') return true;

    const provider = await getProvider();
    if (await hasApiKey(provider)) return true;

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'API key required',
        `You're using your own ${PROVIDER_LABELS[provider]} key, but none is saved yet. Add one in Settings to identify plants.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Open Settings',
            onPress: () => {
              resolve(false);
              router.push('/settings');
            },
          },
        ]
      );
    });
  };

  const handleCapture = async (method: 'camera' | 'library') => {
    if (!(await ensureAIReady())) return;

    const uri = method === 'camera' ? await takePhoto() : await pickFromLibrary();
    if (!uri) return;

    setStep('identifying');
    try {
      const result = await identifyPlant(uri);
      setIdentification(result);
      setPlantName(result.species);
      setStep('confirm');
    } catch (error) {
      Alert.alert(
        'Identification Failed',
        error instanceof Error ? error.message : 'Could not identify the plant. You can still add it manually.',
      );
      setIdentification(null);
      setPlantName('');
      setStep('confirm');
    }
  };

  const handleSave = async () => {
    if (!photo || !plantName.trim()) return;

    setSaving(true);
    try {
      const plant = await addPlant({
        name: plantName.trim(),
        species: identification?.species ?? 'Unknown',
        scientificName: identification?.scientificName,
        photoUri: photo,
        wateringIntervalDays: identification?.wateringIntervalDays ?? 7,
        wateringInstructions: identification?.wateringInstructions,
        lightPreference: identification?.lightPreference,
        notes: identification?.careNotes,
        roomId,
        initialHealthSummary: identification?.initialHealthSummary,
      });

      // Reset state
      clearPhoto();
      setStep('capture');
      setIdentification(null);
      setPlantName('');
      setRoomId(null);

      router.push(`/plant/${plant.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    clearPhoto();
    setStep('capture');
    setIdentification(null);
    setPlantName('');
    setRoomId(null);
  };

  if (step === 'capture') {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <RNView style={styles.captureContainer}>
          <Text style={styles.heading}>Add a New Plant</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Take a photo or choose from your library. AI will identify the plant and create a care schedule.
          </Text>

          <TouchableOpacity
            style={[styles.captureButton, { backgroundColor: colors.tint }]}
            onPress={() => handleCapture('camera')}>
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, styles.secondaryButton, { borderColor: colors.tint }]}
            onPress={() => handleCapture('library')}>
            <Text style={[styles.captureButtonText, { color: colors.tint }]}>Choose from Library</Text>
          </TouchableOpacity>
        </RNView>
      </RNView>
    );
  }

  if (step === 'identifying') {
    return (
      <RNView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        {photo && <Image source={{ uri: photo }} style={styles.previewSmall} />}
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 24 }} />
        <Text style={[styles.identifyingText, { color: colors.secondaryText }]}>
          Identifying your plant...
        </Text>
      </RNView>
    );
  }

  // step === 'confirm'
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.confirmContent}>
        {photo && <Image source={{ uri: photo }} style={styles.previewLarge} />}

        {identification && (
          <RNView style={[styles.identificationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.speciesName}>{identification.species}</Text>
            {identification.scientificName && (
              <Text style={[styles.scientificName, { color: colors.secondaryText }]}>
                {identification.scientificName}
              </Text>
            )}
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {identification.description}
            </Text>

            <RNView style={styles.detailsRow}>
              <RNView style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Water every</Text>
                <Text style={styles.detailValue}>{identification.wateringIntervalDays} days</Text>
              </RNView>
              <RNView style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Light</Text>
                <Text style={styles.detailValue}>
                  {identification.lightPreference?.replace('_', ' ') ?? 'Unknown'}
                </Text>
              </RNView>
            </RNView>

            {identification.wateringInstructions && (
              <RNView style={[styles.subSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>How to water</Text>
                <Text style={[styles.subSectionText, { color: colors.text }]}>
                  {identification.wateringInstructions}
                </Text>
              </RNView>
            )}

            {(identification.initialHealthSummary || identification.initialIssues?.length > 0) && (
              <RNView style={[styles.subSection, { borderTopColor: colors.border }]}>
                <RNView style={styles.healthHeader}>
                  <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Current health</Text>
                  <HealthBadge status={identification.initialHealth} colors={colors} />
                </RNView>
                {identification.initialHealthSummary && (
                  <Text style={[styles.subSectionText, { color: colors.text }]}>
                    {identification.initialHealthSummary}
                  </Text>
                )}
                {identification.initialIssues?.map((issue) => (
                  <RNView key={issue.name} style={styles.issueRow}>
                    <Text style={[styles.issueName, { color: colors.text }]}>{issue.name}</Text>
                    <Text style={[styles.issueText, { color: colors.secondaryText }]}>
                      {issue.description}
                    </Text>
                    <Text style={[styles.issueText, { color: colors.secondaryText, fontStyle: 'italic' }]}>
                      Treatment: {issue.treatment}
                    </Text>
                  </RNView>
                ))}
              </RNView>
            )}
          </RNView>
        )}

        <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Plant nickname</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={plantName}
          onChangeText={setPlantName}
          placeholder="Give your plant a name"
          placeholderTextColor={colors.secondaryText}
        />

        <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Room</Text>
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={[styles.input, styles.roomRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.roomRowText, { color: colors.text }]}>
            {selectedRoom ? `${selectedRoom.emoji}  ${selectedRoom.name}` : 'Choose a room'}
          </Text>
          <Text style={[styles.roomRowChevron, { color: colors.secondaryText }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint }, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving || !plantName.trim()}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Plant</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={[styles.resetButtonText, { color: colors.secondaryText }]}>Start over</Text>
        </TouchableOpacity>
      </ScrollView>

      <RoomPicker
        visible={pickerOpen}
        selectedRoomId={roomId}
        onSelect={setRoomId}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  captureContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 32 },
  captureButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  previewSmall: { width: 200, height: 200, borderRadius: 16 },
  identifyingText: { fontSize: 16, marginTop: 16 },
  confirmContent: { padding: 16, paddingBottom: 40 },
  previewLarge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 16,
  },
  identificationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  speciesName: { fontSize: 22, fontWeight: '700' },
  scientificName: { fontSize: 14, fontStyle: 'italic', marginTop: 2 },
  description: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  detailsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
  detailItem: {},
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  inputLabel: { fontSize: 13, marginBottom: 6, marginLeft: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  resetButton: { alignItems: 'center', marginTop: 16 },
  resetButtonText: { fontSize: 15 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomRowText: { fontSize: 16, fontWeight: '500' },
  roomRowChevron: { fontSize: 20, fontWeight: '300' },
  subSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  subSectionText: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  issueRow: { marginTop: 10 },
  issueName: { fontSize: 14, fontWeight: '600' },
  issueText: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});

interface HealthBadgeProps {
  readonly status: IdentificationResult['initialHealth'];
  readonly colors: typeof Colors.light;
}

function HealthBadge({ status, colors }: Readonly<HealthBadgeProps>) {
  const map: Record<IdentificationResult['initialHealth'], { label: string; bg: string }> = {
    healthy: { label: 'Healthy', bg: colors.success },
    mild_issues: { label: 'Mild issues', bg: colors.warning },
    needs_attention: { label: 'Needs attention', bg: colors.warning },
    critical: { label: 'Critical', bg: colors.error },
  };
  const { label, bg } = map[status] ?? map.healthy;
  return (
    <RNView style={[styles.healthBadge, { backgroundColor: bg }]}>
      <Text style={styles.healthBadgeText}>{label}</Text>
    </RNView>
  );
}
