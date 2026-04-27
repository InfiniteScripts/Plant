import React, { useMemo } from 'react';
import {
  StyleSheet,
  SectionList,
  TouchableOpacity,
  View as RNView,
} from 'react-native';
import { Link } from 'expo-router';
import { Text } from '@/components/Themed';
import { EmptyState } from '@/components/EmptyState';
import { PlantImage } from '@/components/PlantImage';
import { usePlants } from '@/hooks/usePlants';
import { Plant } from '@/models/Plant';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { format, isToday, isTomorrow, isPast, parseISO, addDays, startOfDay } from 'date-fns';

interface ScheduleSection {
  title: string;
  data: Plant[];
}

export default function ScheduleScreen() {
  const { plants, loading, waterPlant } = usePlants();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const sections = useMemo((): ScheduleSection[] => {
    if (plants.length === 0) return [];

    const overdue: Plant[] = [];
    const today: Plant[] = [];
    const tomorrow: Plant[] = [];
    const upcoming: Plant[] = [];

    const sortedPlants = [...plants].sort(
      (a, b) => new Date(a.nextWateringAt).getTime() - new Date(b.nextWateringAt).getTime()
    );

    for (const plant of sortedPlants) {
      const date = parseISO(plant.nextWateringAt);
      if (isPast(date) && !isToday(date)) {
        overdue.push(plant);
      } else if (isToday(date)) {
        today.push(plant);
      } else if (isTomorrow(date)) {
        tomorrow.push(plant);
      } else {
        upcoming.push(plant);
      }
    }

    const result: ScheduleSection[] = [];
    if (overdue.length > 0) result.push({ title: 'Overdue', data: overdue });
    if (today.length > 0) result.push({ title: 'Today', data: today });
    if (tomorrow.length > 0) result.push({ title: 'Tomorrow', data: tomorrow });
    if (upcoming.length > 0) result.push({ title: 'Upcoming', data: upcoming });

    return result;
  }, [plants]);

  if (!loading && plants.length === 0) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No schedule yet"
          message="Add some plants to see your watering schedule here."
        />
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <RNView style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, section.title === 'Overdue' && { color: colors.error }]}>
              {section.title}
            </Text>
          </RNView>
        )}
        renderItem={({ item, section }) => (
          <RNView style={[styles.scheduleItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Link href={`/plant/${item.id}`} asChild>
              <TouchableOpacity style={styles.itemContent}>
                <PlantImage uri={item.photoUri} style={styles.thumbnail} />
                <RNView style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={[styles.itemSpecies, { color: colors.secondaryText }]}>
                    {item.species}
                  </Text>
                  <Text style={[styles.itemDate, { color: colors.secondaryText }]}>
                    {format(parseISO(item.nextWateringAt), 'MMM d, yyyy')}
                  </Text>
                </RNView>
              </TouchableOpacity>
            </Link>
            {(section.title === 'Overdue' || section.title === 'Today') && (
              <TouchableOpacity
                style={[styles.waterButton, { backgroundColor: colors.tint }]}
                onPress={() => waterPlant(item.id)}>
                <Text style={styles.waterButtonText}>Water</Text>
              </TouchableOpacity>
            )}
          </RNView>
        )}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12 },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 50, height: 50, borderRadius: 10 },
  itemInfo: { marginLeft: 12, flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemSpecies: { fontSize: 12, marginTop: 1 },
  itemDate: { fontSize: 11, marginTop: 2 },
  waterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  waterButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
