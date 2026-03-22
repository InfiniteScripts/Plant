import React from 'react';
import { StyleSheet, FlatList, View as RNView, RefreshControl } from 'react-native';
import { usePlants } from '@/hooks/usePlants';
import { PlantCard } from '@/components/PlantCard';
import { EmptyState } from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function MyPlantsScreen() {
  const { plants, loading, loadPlants } = usePlants();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (!loading && plants.length === 0) {
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
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <PlantCard plant={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPlants} tintColor={colors.tint} />
        }
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
});
