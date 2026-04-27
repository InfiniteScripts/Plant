import React from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View as RNView,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

interface MenuItem {
  readonly label: string;
  readonly icon: { ios: string; android: string; web: string };
  readonly onPress: () => void;
}

export default function MoreScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const settingsItems: MenuItem[] = [
    {
      label: 'Manage Rooms',
      icon: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
      onPress: () => router.push('/rooms'),
    },
    {
      label: 'Settings',
      icon: { ios: 'gearshape', android: 'settings', web: 'settings' },
      onPress: () => router.push('/settings'),
    },
  ];

  const legalItems: MenuItem[] = [
    {
      label: 'Privacy Policy',
      icon: { ios: 'lock.shield', android: 'shield', web: 'shield' },
      onPress: () => Linking.openURL('https://petalwise.app/privacy'),
    },
    {
      label: 'Terms of Service',
      icon: { ios: 'doc.text', android: 'description', web: 'description' },
      onPress: () => Linking.openURL('https://petalwise.app/terms'),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <MenuCard items={settingsItems} colors={colors} />
      <MenuCard items={legalItems} colors={colors} />

      <TouchableOpacity
        onPress={handleSignOut}
        style={[
          styles.signOutCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface MenuCardProps {
  readonly items: MenuItem[];
  readonly colors: typeof Colors.light;
}

function MenuCard({ items, colors }: Readonly<MenuCardProps>) {
  return (
    <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          onPress={item.onPress}
          style={[
            styles.row,
            idx < items.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}>
          <SymbolView name={item.icon} tintColor={colors.tint} size={22} />
          <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
          <Text style={[styles.chevron, { color: colors.secondaryText }]}>›</Text>
        </TouchableOpacity>
      ))}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  label: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: { fontSize: 22, fontWeight: '300' },
  signOutCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  signOutText: { fontSize: 16, fontWeight: '600' },
});
