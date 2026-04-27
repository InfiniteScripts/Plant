import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View as RNView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRooms } from '@/hooks/useRooms';
import { Room, DEFAULT_ROOM_EMOJI } from '@/models/Room';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  readonly visible: boolean;
  readonly selectedRoomId: string | null | undefined;
  readonly onSelect: (roomId: string | null) => void;
  readonly onClose: () => void;
  readonly allowNone?: boolean;
}

const EMOJI_CHOICES = ['🪴', '🛋️', '🛏️', '🍽️', '🛁', '💻', '🌿', '🌞', '📚', '🚪'];

export function RoomPicker({ visible, selectedRoomId, onSelect, onClose, allowNone = true }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { rooms, addRoom } = useRooms();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(DEFAULT_ROOM_EMOJI);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const room = await addRoom({ name: newName.trim(), emoji: newEmoji });
    setNewName('');
    setNewEmoji(DEFAULT_ROOM_EMOJI);
    setCreating(false);
    onSelect(room.id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <RNView style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <RNView style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={styles.title}>Select Room</Text>

          <ScrollView contentContainerStyle={styles.list}>
            {allowNone && (
              <RoomRow
                label="Unassigned"
                emoji="—"
                selected={!selectedRoomId}
                colors={colors}
                onPress={() => {
                  onSelect(null);
                  onClose();
                }}
              />
            )}
            {rooms.map((room: Room) => (
              <RoomRow
                key={room.id}
                label={room.name}
                emoji={room.emoji}
                selected={selectedRoomId === room.id}
                colors={colors}
                onPress={() => {
                  onSelect(room.id);
                  onClose();
                }}
              />
            ))}

            {creating ? (
              <RNView style={[styles.createCard, { borderColor: colors.border }]}>
                <Text style={[styles.createLabel, { color: colors.secondaryText }]}>Emoji</Text>
                <RNView style={styles.emojiRow}>
                  {EMOJI_CHOICES.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setNewEmoji(e)}
                      style={[
                        styles.emojiChip,
                        {
                          backgroundColor: newEmoji === e ? colors.tint : colors.background,
                          borderColor: colors.border,
                        },
                      ]}>
                      <Text style={styles.emojiChipText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </RNView>
                <Text style={[styles.createLabel, { color: colors.secondaryText, marginTop: 12 }]}>
                  Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Sunroom"
                  placeholderTextColor={colors.secondaryText}
                  autoFocus
                />
                <RNView style={styles.createActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setCreating(false);
                      setNewName('');
                    }}>
                    <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    disabled={!newName.trim()}
                    style={[
                      styles.createButton,
                      { backgroundColor: colors.tint, opacity: newName.trim() ? 1 : 0.5 },
                    ]}>
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </RNView>
              </RNView>
            ) : (
              <TouchableOpacity
                style={[styles.addRow, { borderColor: colors.border }]}
                onPress={() => setCreating(true)}>
                <Text style={[styles.addRowText, { color: colors.tint }]}>+ New room</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </RNView>
    </Modal>
  );
}

interface RowProps {
  readonly label: string;
  readonly emoji: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly colors: typeof Colors.light;
}

function RoomRow({ label, emoji, selected, onPress, colors }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: selected ? colors.tint : colors.background,
          borderColor: colors.border,
        },
      ]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <Text style={[styles.rowLabel, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTouch: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  list: { paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowEmoji: { fontSize: 22, marginRight: 12 },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  addRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
    alignItems: 'center',
  },
  addRowText: { fontSize: 15, fontWeight: '600' },
  createCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  createLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiChip: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChipText: { fontSize: 20 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    marginTop: 4,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  cancelText: { fontSize: 15, fontWeight: '500' },
  createButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
