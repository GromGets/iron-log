import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet } from 'react-native';
import { Button } from './UI';
import { colors, space, type, radius } from '@/theme/theme';
import { useActiveStudent } from '@/context/StudentContext';

// Shared by the student switcher and the quick-actions FAB — both need the
// exact same "add a person" flow, so it lives here once.
export function AddStudentModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { createStudent } = useActiveStudent();
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createStudent(name);
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={type.title}>New person</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Juan"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoFocus
          />
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => {
                  setName('');
                  onClose();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Add" onPress={handleAdd} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    width: '100%',
  },
  input: {
    marginTop: space.md,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
});
