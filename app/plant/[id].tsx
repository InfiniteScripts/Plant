import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { File } from 'expo-file-system';
import { Text } from '@/components/Themed';
import { HealthDiagnosis } from '@/components/HealthDiagnosis';
import { RoomPicker } from '@/components/RoomPicker';
import { PlantImage } from '@/components/PlantImage';
import { usePlantStore } from '@/stores/plantStore';
import { useRooms } from '@/hooks/useRooms';
import { useCamera } from '@/hooks/useCamera';
import { diagnosePlant } from '@/services/ai';
import { DiagnosisResult } from '@/models/DiagnosisResult';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const plant = usePlantStore((s) => s.getPlantById(id!));
  const waterPlant = usePlantStore((s) => s.waterPlant);
  const removePlant = usePlantStore((s) => s.removePlant);
  const updatePlant = usePlantStore((s) => s.updatePlant);
  const { takePhoto, pickFromLibrary } = useCamera();
  const { rooms } = useRooms();

  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Omit<DiagnosisResult, 'plantId' | 'photoUri' | 'timestamp'> | null>(null);
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);

  const currentRoom = rooms.find((r) => r.id === plant?.roomId);

  if (!plant) {
    return (
      <RNView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text>Plant not found</Text>
      </RNView>
    );
  }

  const needsWater = new Date(plant.nextWateringAt) <= new Date();
  const lastWateredText = plant.lastWateredAt
    ? formatDistanceToNow(parseISO(plant.lastWateredAt), { addSuffix: true })
    : 'Never';
  const nextWateringText = format(parseISO(plant.nextWateringAt), 'MMM d, yyyy');

  const handleDiagnose = async () => {
    if (!plant.photoUri || !new File(plant.photoUri).exists) {
      Alert.alert(
        'Photo unavailable',
        "We can't find this plant's saved photo. Take a new one to diagnose its health.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take photo', onPress: handleDiagnoseNewPhoto },
        ]
      );
      return;
    }

    setDiagnosing(true);
    try {
      const result = await diagnosePlant(plant.photoUri, plant.species);
      setDiagnosis(result);
    } catch (error) {
      Alert.alert('Diagnosis Failed', error instanceof Error ? error.message : 'Could not diagnose the plant.');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleDiagnoseNewPhoto = async () => {
    const uri = await takePhoto();
    if (!uri) return;

    setDiagnosing(true);
    try {
      const result = await diagnosePlant(uri, plant.species);
      setDiagnosis(result);
    } catch (error) {
      Alert.alert('Diagnosis Failed', error instanceof Error ? error.message : 'Could not diagnose the plant.');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleWater = async () => {
    await waterPlant(plant.id);
    Alert.alert('Watered!', `Next watering scheduled for ${plant.wateringIntervalDays} days from now.`);
  };

  const handleDelete = () => {
    Alert.alert('Delete Plant', `Are you sure you want to remove ${plant.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removePlant(plant.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: plant.name }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}>
        <PlantImage uri={plant.photoUri} style={styles.heroImage} />

        <RNView style={styles.header}>
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={[styles.species, { color: colors.secondaryText }]}>
            {plant.species}
            {plant.scientificName ? ` (${plant.scientificName})` : ''}
          </Text>
        </RNView>

        {/* Quick Info */}
        <RNView style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <RNView style={styles.infoRow}>
            <RNView style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Water every</Text>
              <Text style={styles.infoValue}>{plant.wateringIntervalDays} days</Text>
            </RNView>
            <RNView style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Light</Text>
              <Text style={styles.infoValue}>{plant.lightPreference?.replace('_', ' ') ?? 'Unknown'}</Text>
            </RNView>
          </RNView>
          <RNView style={[styles.infoRow, { marginTop: 12 }]}>
            <RNView style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Last watered</Text>
              <Text style={styles.infoValue}>{lastWateredText}</Text>
            </RNView>
            <RNView style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Next watering</Text>
              <Text style={[styles.infoValue, needsWater && { color: colors.error }]}>
                {needsWater ? 'Now!' : nextWateringText}
              </Text>
            </RNView>
          </RNView>

          <TouchableOpacity
            onPress={() => setRoomPickerOpen(true)}
            style={[styles.roomRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Room</Text>
            <RNView style={styles.roomRowRight}>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {currentRoom ? `${currentRoom.emoji}  ${currentRoom.name}` : 'Unassigned'}
              </Text>
              <Text style={[styles.roomRowChevron, { color: colors.secondaryText }]}>›</Text>
            </RNView>
          </TouchableOpacity>
        </RNView>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1565C0' }]}
          onPress={handleWater}>
          <Text style={styles.actionButtonText}>Mark as Watered</Text>
        </TouchableOpacity>

        <RNView style={styles.diagnosisActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.halfButton, { backgroundColor: colors.tint }]}
            onPress={handleDiagnose}
            disabled={diagnosing}>
            <Text style={styles.actionButtonText}>Diagnose Health</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.halfButton, { backgroundColor: colors.accent }]}
            onPress={handleDiagnoseNewPhoto}
            disabled={diagnosing}>
            <Text style={styles.actionButtonText}>New Photo Diagnosis</Text>
          </TouchableOpacity>
        </RNView>

        {diagnosing && (
          <RNView style={styles.diagnosingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.diagnosingText, { color: colors.secondaryText }]}>
              Analyzing plant health...
            </Text>
          </RNView>
        )}

        {diagnosis && <HealthDiagnosis diagnosis={diagnosis} />}

        {/* Watering Instructions */}
        {plant.wateringInstructions && (
          <RNView style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.notesTitle}>How to water</Text>
            <Text style={[styles.notesText, { color: colors.secondaryText }]}>
              {plant.wateringInstructions}
            </Text>
          </RNView>
        )}

        {/* Initial Health */}
        {plant.initialHealthSummary && (
          <RNView style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.notesTitle}>Health on arrival</Text>
            <Text style={[styles.notesText, { color: colors.secondaryText }]}>
              {plant.initialHealthSummary}
            </Text>
          </RNView>
        )}

        {/* Notes */}
        {plant.notes && (
          <RNView style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.notesTitle}>Care Notes</Text>
            <Text style={[styles.notesText, { color: colors.secondaryText }]}>{plant.notes}</Text>
          </RNView>
        )}

        {/* Delete */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete Plant</Text>
        </TouchableOpacity>
      </ScrollView>

      <RoomPicker
        visible={roomPickerOpen}
        selectedRoomId={plant.roomId}
        onSelect={(newRoomId) => updatePlant(plant.id, { roomId: newRoomId })}
        onClose={() => setRoomPickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 40 },
  heroImage: { width: '100%', aspectRatio: 1 },
  header: { padding: 16 },
  plantName: { fontSize: 28, fontWeight: '800' },
  species: { fontSize: 16, marginTop: 4 },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row' },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  actionButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  diagnosisActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 0,
  },
  diagnosingContainer: { alignItems: 'center', padding: 24 },
  diagnosingText: { marginTop: 12, fontSize: 15 },
  notesCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  notesTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  notesText: { fontSize: 14, lineHeight: 20 },
  deleteButton: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    padding: 12,
  },
  deleteButtonText: { fontSize: 16, fontWeight: '500' },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  roomRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomRowChevron: { fontSize: 20, fontWeight: '300' },
});
