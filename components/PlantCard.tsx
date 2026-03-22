import React from 'react';
import { StyleSheet, Image, TouchableOpacity, View as RNView } from 'react-native';
import { Link } from 'expo-router';
import { Plant } from '@/models/Plant';
import { Text, View } from '@/components/Themed';
import { WateringBadge } from './WateringBadge';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const needsWater = new Date(plant.nextWateringAt) <= new Date();

  return (
    <Link href={`/plant/${plant.id}`} asChild>
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: plant.photoUri }} style={styles.image} />
        <RNView style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
          <Text style={[styles.species, { color: colors.secondaryText }]} numberOfLines={1}>
            {plant.species}
          </Text>
          {needsWater && <WateringBadge />}
        </RNView>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    width: '48%',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E8F5E9',
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  species: {
    fontSize: 12,
    marginTop: 2,
  },
});
