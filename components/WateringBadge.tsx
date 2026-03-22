import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export function WateringBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Needs water</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#1565C0',
    fontSize: 11,
    fontWeight: '600',
  },
});
