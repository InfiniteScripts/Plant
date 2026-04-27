import React from 'react';
import { StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { Link } from 'expo-router';
import { Plant } from '@/models/Plant';
import { Text } from '@/components/Themed';
import { PlantImage } from './PlantImage';
import { WateringBadge } from './WateringBadge';
import { useRoomStore } from '@/stores/roomStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { format, parseISO } from 'date-fns';

interface PlantCardProps {
  readonly plant: Plant;
}

export function PlantCard({ plant }: Readonly<PlantCardProps>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const room = useRoomStore((s) => s.getRoomById(plant.roomId));
  const needsWater = new Date(plant.nextWateringAt) <= new Date();

  return (
    <Link href={`/plant/${plant.id}`} asChild>
      <TouchableOpacity
        style={StyleSheet.flatten([
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ])}>
        <PlantImage uri={plant.photoUri} style={styles.thumbnail} />
        <RNView style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {plant.name}
          </Text>
          <Text style={[styles.species, { color: colors.secondaryText }]} numberOfLines={1}>
            {plant.species}
          </Text>
          {room && (
            <Text style={[styles.room, { color: colors.secondaryText }]} numberOfLines={1}>
              {room.emoji} {room.name}
            </Text>
          )}
          <Text style={[styles.date, { color: colors.secondaryText }]} numberOfLines={1}>
            Next watering: {format(parseISO(plant.nextWateringAt), 'MMM d')}
          </Text>
          {needsWater && <WateringBadge />}
        </RNView>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  species: {
    fontSize: 13,
    marginTop: 2,
  },
  room: {
    fontSize: 12,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    marginTop: 3,
  },
});
