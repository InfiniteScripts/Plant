import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  View as RNView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Themed';
import { usePlants } from '@/hooks/usePlants';
import { useRooms } from '@/hooks/useRooms';
import { PlantCard } from '@/components/PlantCard';
import { EmptyState } from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function MyPlantsScreen() {
  const { plants, loading, loadPlants } = usePlants();
  const { rooms } = useRooms();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  // Filter is 'all', 'unassigned', or a roomId.
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return plants;
    if (filter === 'unassigned') return plants.filter((p) => !p.roomId);
    return plants.filter((p) => p.roomId === filter);
  }, [plants, filter]);

  const noPlantsAtAll = !loading && plants.length === 0;

  if (noPlantsAtAll) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No plants yet"
          message="Tap the Add Plant tab to photograph your first plant and get AI-powered care instructions."
        />
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <RNView style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          <FilterChip
            label="All"
            active={filter === 'all'}
            colors={colors}
            onPress={() => setFilter('all')}
          />
          {rooms.map((room) => (
            <FilterChip
              key={room.id}
              label={`${room.emoji} ${room.name}`}
              active={filter === room.id}
              colors={colors}
              onPress={() => setFilter(room.id)}
            />
          ))}
          <FilterChip
            label="Unassigned"
            active={filter === 'unassigned'}
            colors={colors}
            onPress={() => setFilter('unassigned')}
          />
          <TouchableOpacity
            onPress={() => router.push('/rooms')}
            style={[styles.manageChip, { borderColor: colors.border }]}>
            <Text style={[styles.manageText, { color: colors.tint }]}>Manage</Text>
          </TouchableOpacity>
        </ScrollView>
      </RNView>

      {filtered.length === 0 ? (
        <RNView style={styles.emptyFiltered}>
          <Text style={[styles.emptyFilteredText, { color: colors.secondaryText }]}>
            No plants in this view yet.
          </Text>
        </RNView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PlantCard plant={item} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadPlants} tintColor={colors.tint} />
          }
        />
      )}
    </RNView>
  );
}

interface ChipProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
  readonly colors: typeof Colors.light;
}

function FilterChip({ label, active, onPress, colors }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.tint : colors.card,
          borderColor: colors.border,
        },
      ]}>
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterWrapper: {
    paddingVertical: 10,
  },
  filterRow: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  manageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  manageText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  emptyFiltered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyFilteredText: { fontSize: 14 },
});
