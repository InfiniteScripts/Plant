import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  readonly uri?: string | null;
  readonly style?: StyleProp<ImageStyle>;
  readonly fallbackStyle?: StyleProp<ViewStyle>;
}

export function PlantImage({ uri, style, fallbackStyle }: Props) {
  const scheme = useColorScheme();
  const palette = Colors[scheme];
  const [errored, setErrored] = useState(false);

  const showFallback = !uri || errored;

  if (showFallback) {
    return (
      <View
        style={[
          styles.fallback,
          {
            backgroundColor: scheme === 'dark' ? '#1B3A22' : '#E8F5E9',
          },
          style as StyleProp<ViewStyle>,
          fallbackStyle,
        ]}>
        <Text style={[styles.icon, { color: palette.tint }]}>🪴</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setErrored(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 56,
  },
});
