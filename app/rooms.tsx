import React, { useState } from 'react';
import {
  StyleSheet,
  View as RNView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/Themed';
import { useRooms } from '@/hooks/useRooms';
import { Room, DEFAULT_ROOM_EMOJI } from '@/models/Room';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const EMOJI_CHOICES = ['🪴', '🛋️', '🛏️', '🍽️', '🛁', '💻', '🌿', '🌞', '📚', '🚪'];

export default function ManageRoomsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { rooms, addRoom, removeRoom, updateRoom } = useRooms();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState(DEFAULT_ROOM_EMOJI);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(DEFAULT_ROOM_EMOJI);

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setEditName(room.name);
    setEditEmoji(room.emoji);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateRoom(editingId, { name: editName.trim(), emoji: editEmoji });
    cancelEdit();
  };

  const handleDelete = (room: Room) => {
    Alert.alert(
      `Delete ${room.name}?`,
      'Plants in this room will be moved to "Unassigned". They will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeRoom(room.id) },
      ]
    );
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await addRoom({ name: newName.trim(), emoji: newEmoji });
    setNewName('');
    setNewEmoji(DEFAULT_ROOM_EMOJI);
    setCreating(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Manage Rooms' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}>
        {rooms.map((room) => {
          const isEditing = editingId === room.id;
          return (
            <RNView
              key={room.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {isEditing ? (
                <RNView>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Emoji</Text>
                  <RNView style={styles.emojiRow}>
                    {EMOJI_CHOICES.map((e) => (
                      <TouchableOpacity
                        key={e}
                        onPress={() => setEditEmoji(e)}
                        style={[
                          styles.emojiChip,
                          {
                            backgroundColor: editEmoji === e ? colors.tint : colors.background,
                            borderColor: colors.border,
                          },
                        ]}>
                        <Text style={styles.emojiChipText}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNView>
                  <Text style={[styles.label, { color: colors.secondaryText, marginTop: 12 }]}>
                    Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                  />
                  <RNView style={styles.actions}>
                    <TouchableOpacity onPress={cancelEdit}>
                      <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={saveEdit}
                      style={[styles.saveButton, { backgroundColor: colors.tint }]}>
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </RNView>
                </RNView>
              ) : (
                <RNView style={styles.row}>
                  <Text style={styles.rowEmoji}>{room.emoji}</Text>
                  <Text style={[styles.rowName, { color: colors.text }]}>{room.name}</Text>
                  <TouchableOpacity onPress={() => startEdit(room)}>
                    <Text style={[styles.actionText, { color: colors.tint }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(room)} style={{ marginLeft: 14 }}>
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </RNView>
              )}
            </RNView>
          );
        })}

        {creating ? (
          <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Emoji</Text>
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
            <Text style={[styles.label, { color: colors.secondaryText, marginTop: 12 }]}>Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Room name"
              placeholderTextColor={colors.secondaryText}
              autoFocus
            />
            <RNView style={styles.actions}>
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
                  styles.saveButton,
                  { backgroundColor: colors.tint, opacity: newName.trim() ? 1 : 0.5 },
                ]}>
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </RNView>
          </RNView>
        ) : (
          <TouchableOpacity
            onPress={() => setCreating(true)}
            style={[styles.addCard, { borderColor: colors.border }]}>
            <Text style={[styles.addText, { color: colors.tint }]}>+ Add room</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowEmoji: { fontSize: 24, marginRight: 12 },
  rowName: { flex: 1, fontSize: 16, fontWeight: '600' },
  actionText: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    marginTop: 4,
  },
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  cancelText: { fontSize: 15, fontWeight: '500' },
  saveButton: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  addCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: { fontSize: 16, fontWeight: '600' },
});
